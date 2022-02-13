import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class Post {
  // Removing the Field decorator will prevent field from being exposed in graphql schema
  @Field(() => Int)
  @PrimaryKey()
  id!: number;

  @Field(() => String)
  @Property({type: 'date'})
  createdAt?: Date = new Date();

  @Field(() => String)
  @Property({ type: 'date', onUpdate: () => new Date() })
  updatedAt?: Date = new Date();

  @Field()
  @Property({type: 'text'})
  title!: string;
}