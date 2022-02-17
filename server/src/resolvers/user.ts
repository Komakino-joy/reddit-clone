import { User } from "../entities/User";
import { MyContext } from "src/types";
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import argon2 from "argon2";
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "../constants";
import { UserNamePasswordInput } from "./UserNamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";
// import { getConnection } from "typeorm";

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
        @Ctx() {redis, req}: MyContext,
    ): Promise<UserResponse> {
        if (newPassword.length <= 3) {
            return { errors: [{
                field: "newPassword",
                message: "Password length must be longer than 3 characters."
            }]}
        };

        const key = FORGOT_PASSWORD_PREFIX + token;
        const userId = await redis.get(key);

        if (!userId) {
            return { errors: [{
                field: "token",
                message: "token expired"
            }]}
        };

        const userIdNum = parseInt(userId);
        // Redis stores all values as strings, therefore parseInt must be used.
        const user = await User.findOne(userIdNum);

        if (!user) {
            return { errors: [{
                field: "token",
                message: "user no longer exists"
            }]}
        };

        await User.update(
            {id: userIdNum}, 
            {
                password: await argon2.hash(newPassword)
            }
        );

        // clear the token after successful password change
        await redis.del(key)

        // log user in after changed password
        req.session.userId = user.id;

        return { user }
    };

    @Mutation(() => Boolean) 
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() { redis } : MyContext
    ) {             
        const user = await User.findOne({where: { email }}) // where clause required when column is not the primary key
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
    me(
        @Ctx() { req }: MyContext
    ) {
        // You are not logged in
        if (!req.session.userId) {
            return null
        };

        return User.findOne(req.session.userId);
    }

    @Mutation(() => UserResponse)
    async register( 
        @Arg('options') options: UserNamePasswordInput,
        @Ctx() { req }: MyContext
        ): Promise<UserResponse> {

            const errors = validateRegister(options); 
            if (errors) {
                return { errors }
            }

            const hashedPassword = await argon2.hash(options.password);
        
            let user;

            try {
                user = await User.create({
                    username: options.username, 
                    email: options.email,
                    password: hashedPassword
                }).save();
                
                // Using Query Builder example
                // const result = await getConnection()
                // .createQueryBuilder()
                // .insert()
                // .into(User)
                // .values({                
                //     username: options.username, 
                //     email: options.email,
                //     password: hashedPassword
                // })
                // .returning('*')
                // .execute();
                // user = result.raw[0]
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
            req.session.userId = user?.id;

            return { user };
    };

    @Mutation(() => UserResponse)
    async login( 
        @Arg('usernameOrEmail') usernameOrEmail: string,
        @Arg('password') password: string,
        @Ctx() { req }: MyContext
        ): Promise<UserResponse> {
            const user = await User.findOne( 
                usernameOrEmail.includes("@") 
                ? { where: {email: usernameOrEmail} }
                : { where: {username: usernameOrEmail} }
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