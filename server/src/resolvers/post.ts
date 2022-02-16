import { Post } from "../entities/Post";
import { Arg, Int, Mutation, Query, Resolver } from "type-graphql";

// String and Int can be inferred, but using them explicitly below
// @Arg('title', () => String) same as @Arg('title')
@Resolver()
export class PostResolver {
    @Query(() => [Post])
    posts(): Promise<Post[]> {
        return Post.find();
    };

    @Query(() => Post, { nullable: true })
    post( @Arg('id', () => Int) id: number): Promise<Post | undefined> {
        return Post.findOne(id);
    };

    @Mutation(() => Post)
    async createPost(@Arg('title', () => String) title: string ): Promise<Post> {
            // 2 SQL queries are created in the background
            return Post.create({title}).save();  
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