import { Field } from "type-graphql";
import {BaseEntity, Column, Entity, ManyToOne, PrimaryColumn} from "typeorm";
import { Post } from "./Post";
import { User } from "./User";

@Entity()
export class UpVote extends BaseEntity { // BaseEntity allows us to use Post.find, Post.insert ...etc

    @Column({type: "int"})
    value: number

    @PrimaryColumn()
    userId!: number;

    @Field(() => User)
    @ManyToOne(() => User)
    user: User;

    @PrimaryColumn()
    postId!: number;

    @ManyToOne(() => Post)
    post: Post;

}