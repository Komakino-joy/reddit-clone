import { User } from "../entities/User";
import { MyContext } from "src/types";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from "type-graphql";
import argon2 from "argon2";

@InputType()
class UserNamePasswordInput {
    @Field()
    username: string

    @Field()
    password: string
};

@ObjectType()
class FieldError {
    @Field()
    field: string;

    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[];

    @Field(() => User, {nullable:true})
    user?: User;
};

@Resolver()
export class UserResolver {

    @Mutation(() => UserResponse)
    async register( 
        @Arg('options') options: UserNamePasswordInput,
        @Ctx() { em }: MyContext
        ): Promise<UserResponse> {
            if (options.username.length <= 2) {
                return {
                    errors: [{
                        field: "username",
                        message: "username length must be longer than 2 characters"
                    }],
                };
            };

            if (options.password.length <= 3) {
                return {
                    errors: [{
                        field: "password",
                        message: "password length must be longer than 3 characters"
                    }],
                };
            }; 

            const hashedPassword = await argon2.hash(options.password);
            const user = em.create(User, { 
                username: options.username, 
                password: hashedPassword 
            });

            try {
                await em.persistAndFlush(user);
            } catch (error) {
                // Duplicate username error.
                if (error.code = '23505' || error.detail.includes("already exists")) {
                    return {
                        errors: [{
                            field: 'username',
                            message: 'username already taken.'
                        }]
                    }
                }
            }

            return { user }
    };

    @Mutation(() => UserResponse)
    async login( 
        @Arg('options') options: UserNamePasswordInput,
        @Ctx() { em, req }: MyContext
        ): Promise<UserResponse> {
            const user = await em.findOne(User, { username: options.username.toLowerCase() });

            if (!user) {
                return {
                        errors: [{
                            field: "username",
                            message: "That username does not exist."
                        },
                    ],
                };
            };

            const valid = await argon2.verify(user.password, options.password);

            if (!valid) {
                    return {
                        errors: [{
                            field: "password",
                            message: "Incorrect password."
                        },
                    ],
                };
            }

            req.session.userId = user.id

            return {
                user,
            }
    };

};