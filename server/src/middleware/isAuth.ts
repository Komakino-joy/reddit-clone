
import { MyContext } from "src/types";
import { MiddlewareFn } from "type-graphql";

// Middle ware runs before the resolvers 
export const isAuth: MiddlewareFn<MyContext> = ({context}, next) => {
    if (!context.req.session.userId) {
        throw new Error("Not authenticated"); 
    };

    return next();
} 
