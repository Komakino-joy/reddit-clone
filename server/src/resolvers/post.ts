import { Post } from "../entities/Post";
import { Arg, Ctx, Field, FieldResolver, InputType, Int, Mutation, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import { MyContext } from "src/types";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";


@InputType() 
class PostInput {
    @Field()
    title: string;
    
    @Field()
    text: string;
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
    }

    @Query(() => [Post])
    async posts(
        @Arg('limit', () => Int) limit: number,
        @Arg('cursor', () => String, {nullable: true}) cursor: string | null,
    ): Promise<Post[]> {
        const realLimit = Math.min(50, limit)
        
        const qb = getConnection()
                .getRepository(Post)
                .createQueryBuilder("p") // alias
                .orderBy('"createdAt"', "DESC")
                .take(realLimit)
                
        if (cursor) {
            qb.where('"createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) })
        }
        
        return qb.getMany(); // execute SQL
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