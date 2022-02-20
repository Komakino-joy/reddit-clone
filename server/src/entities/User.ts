import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Post } from "./Post";
import { UpVote } from "./UpVote";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  // Removing the Field decorator will prevent field from being exposed in graphql schema
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt?: Date;

  
  @Field()
  @Column({unique: true})
  email!: string;
  
  @Column()
  password!: string;

  @OneToMany(() => Post, post => post.creator)
  posts: Post[];

  @OneToMany(() => UpVote, (upvote) => upvote.user)
  upvotes: UpVote[];

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt?: Date;

  @Field()
  @Column({unique: true})
  username!: string;
  
};