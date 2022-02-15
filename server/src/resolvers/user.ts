import { User } from "../entities/User";
import { MyContext } from "src/types";
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import argon2 from "argon2";
import { EntityManager } from "@mikro-orm/postgresql"
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "../constants";
import { UserNamePasswordInput } from "./UserNamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";

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
    async changePassword(
        @Arg('token') token : string,
        @Arg('newPassword') newPassword: string,
        @Ctx() {redis, em}: MyContext,
    ): Promise<UserResponse> {
        if (newPassword.length <= 3) {
            return { errors: [{
                field: "newPassword",
                message: "Password length must be longer than 3 characters."
            }]}
        };

        const userId = await redis.get(FORGOT_PASSWORD_PREFIX + token);

        if (!userId) {
            return { errors: [{
                field: "token",
                message: "token expired"
            }]}
        };

        // Redis stores all values as strings, therefore parseInt must be used.
        const user = await em.findOne(User, { id: parseInt(userId) });

        if (!user) {
            return { errors: [{
                field: "token",
                message: "user no longer exists"
            }]}
        };
        
        user.password = await argon2.hash(newPassword);
        await em.persistAndFlush(user);

        return { user }
    };

    @Mutation(() => Boolean) 
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() { em, redis } : MyContext
    ) {
        const user = await em.findOne(User, { email })
        if (!user) {
            // The email is not in db
            return true;
        }

        const token = v4();
        await redis.set(FORGOT_PASSWORD_PREFIX + token, user.id, 'ex', 1000 * 60 * 60 * 24 * 3); // 3 days

        await sendEmail(email, `<a href="http://localhost:3000/change-password/${token}">Reset password</a>`)

        return true
    }

    @Query(() => User, {nullable: true})
    async me(
        @Ctx() { req, em }: MyContext
    ) {
        // You are not logged in
        if (!req.session.userId) {
            return null
        };

        const user = await em.findOne(User, {id: req.session.userId});
        return user;
    }

    @Mutation(() => UserResponse)
    async register( 
        @Arg('options') options: UserNamePasswordInput,
        @Ctx() { em, req }: MyContext
        ): Promise<UserResponse> {

            const errors = validateRegister(options); 
            if (errors) {
                return { errors }
            }

            const hashedPassword = await argon2.hash(options.password);
            
            // Create use without knex
            // const user = em.create(User, { 
            //     username: options.username, 
            //     password: hashedPassword 
            // });

            let user;

            try {
                const result= await (em as EntityManager)
                    .createQueryBuilder(User)
                    .getKnexQuery()
                    .insert({                
                        username: options.username, 
                        email: options.email,
                        password: hashedPassword,
                        created_at: new Date(),
                        updated_at: new Date() 
                    })
                    .returning("*");
                user = result[0];
                // Optional method without query builder
                // await em.persistAndFlush(user);
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

            // store userId session
            // This will store a cookie on the user
            // keep them logged in
            req.session.userId = user.id;

            return { user };
    };

    @Mutation(() => UserResponse)
    async login( 
        @Arg('usernameOrEmail') usernameOrEmail: string,
        @Arg('password') password: string,
        @Ctx() { em, req }: MyContext
        ): Promise<UserResponse> {
            const user = await em.findOne(User, 
                usernameOrEmail.includes("@") 
                ? { email: usernameOrEmail }
                : { username: usernameOrEmail }
                );

            if (!user) {
                return {
                        errors: [{
                            field: "usernameOrEmail",
                            message: "That username does not exist."
                        },
                    ],
                };
            };

            const valid = await argon2.verify(user.password, password);

            if (!valid) {
                    return {
                        errors: [{
                            field: "password",
                            message: "Incorrect password."
                        },
                    ],
                };
            }

            req.session.userId = user.id;

            return {
                user,
            }
    };

    @Mutation(() => Boolean)
    logout(
        @Ctx() {req, res}: MyContext
    ) {
        return new Promise( resolve => req.session.destroy( err => {
            res.clearCookie(COOKIE_NAME);
            if(err) {
                console.log(err);
                resolve(false);
                return 
            }
            
            resolve(true);
        })) 
    }
};