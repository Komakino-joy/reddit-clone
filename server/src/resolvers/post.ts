import { Post } from "../entities/Post";
import { Arg, Ctx, Field, FieldResolver, InputType, Int, Mutation, ObjectType, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import { MyContext } from "src/types";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { UpVote } from "../entities/UpVote";


@InputType() 
class PostInput {
    @Field()
    title: string;
    
    @Field()
    text: string;
}

@ObjectType()
class PaginatedPosts {
        @Field(() => [Post])
        posts: Post[]
        @Field()
        hasMore: boolean
    }

// String and Int can be inferred, but using them explicitly below
// @Arg('title', () => String) same as @Arg('title')
//Post is passed in because it is required when we have a FieldResolver
@Resolver(Post)
export class PostResolver {

    @FieldResolver(() => String)
    textSnippet(
        @Root() root: Post
    ) {
        return root.text.slice(0,50);
    };

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async vote(
        @Arg('postId', () => Int) postId: number,
        @Arg('value', () => Int) value: number,
        @Ctx() {req}: MyContext
    ) {
        const isUpVote = value != -1;
        const realValue = isUpVote ? 1 : -1;
        const { userId } = req.session
        await UpVote.insert({
            userId,
            postId,
            value: realValue
        });
        await getConnection().query(`
            START TRANSACTION;

                insert into upvote ("userId", "postId", value)
                values (${userId}, ${postId}, ${realValue});

                update post
                set points = points + ${realValue}
                where id = ${postId};

            COMMIT;
        `);

        return true;
    }

    @Query(() => PaginatedPosts)
    async posts(
        @Arg('limit', () => Int) limit: number,
        @Arg('cursor', () => String, {nullable: true}) cursor: string | null,
    ): Promise<PaginatedPosts> {
        const realLimit = Math.min(50, limit) ;
        // Actually fetching an extra post in order to know if we have more to show
        const realLimitPlusOne = realLimit + 1;

        const replacements: any[] = [realLimitPlusOne];

        if (cursor) {
            replacements.push(new Date(parseInt(cursor)));
        };

        const posts = await getConnection().query(`
            select p.*,
            json_build_object(
                'id', u.id,
                'username', u.username,
                'email', u.email,
                'createdAt', u."createdAt",
                'updatedAt', u."updatedAt"
                ) creator
            from post p
            inner join public.user u on u.id = p."creatorId"
            ${cursor ? `where p."createdAt" < $2`  : ''}
            order by p."createdAt" DESC
            limit $1
        `, replacements)

        // const qb = getConnection()
        //         .getRepository(Post)
        //         .createQueryBuilder("p") // alias
        //         .innerJoin(
        //             "p.creator",
        //             "u",
        //             'u.id = p."creatorId"'
        //         )
        //         .orderBy('p."createdAt"', "DESC")
        //         .take(realLimitPlusOne)
                
        // if (cursor) {
        //     qb.where('p."createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) })
        // }

        // const posts = await qb.getMany()
        
        return {
            posts: posts.slice(0, realLimit),
            hasMore: posts.length === realLimitPlusOne,
        }; 
    };

    @Query(() => Post, { nullable: true })
    post( @Arg('id', () => Int) id: number): Promise<Post | undefined> {
        return Post.findOne(id);
    };

    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async createPost(
        @Arg("input") input: PostInput,
        @Ctx() {req}: MyContext
        ): Promise<Post> {
            return Post.create({
                ...input,
                creatorId: req.session.userId
            }).save();  
    };

    @Mutation(() => Post, {nullable: true})
    async updatePost( 
            @Arg('id', () => Int) id: number,
            @Arg('title', () => String) title: string,

        ): Promise<Post | null> {
            const post = await Post.findOne(id);

            if (!post) {
                return null;
            }
            
            if (typeof title !== 'undefined') {
                await Post.update({id}, {title})
            }

            return post;  
    };

    @Mutation(() => Boolean)
    async deletePost(@Arg('id', () => Int) id: number): Promise<boolean> {
            await Post.delete(id)
            return true;  
    };
};