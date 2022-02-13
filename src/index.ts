import "reflect-metadata";
import { MikroORM} from '@mikro-orm/core';
import { __prod__ } from './constants';
// import { Post } from './entities/Post';
import microConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from "./resolvers/user";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";
import { MyContext } from "./types";

declare module 'express-session' {
  export interface SessionData {
    user: { [key: string]: any };
  }
}

const main = async () => {
    // Connect to Database
    const orm = await MikroORM.init(microConfig);
    // Run Migrations
    await orm.getMigrator().up();
    // Run SQL
    // Create Post
    // const post = orm.em.create(Post, { title: 'My first post' });
    // await orm.em.persistAndFlush(post);

    // Fetch post
    // const posts = await orm.em.find(Post, {});
    // console.log(posts)

    const app = express();

    const RedisStore = connectRedis(session);
    const redis = new Redis(process.env.REDIS_URL || "localhost:6379");
    app.set("trust proxy", 1);
    app.use(
      cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
      })
    );
    app.use(
      session({
        name: 'qid',
        store: new RedisStore({
          client: redis,
          disableTouch: true,
        }),
        cookie: {
          maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
          httpOnly: true,
          sameSite: "lax", // csrf
          secure: __prod__, // cookie only works in https
        //   domain: __prod__ ? ".codeponder.com" : undefined,
        },
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET || 'SecretDevelopmentKey',
        resave: false,
      })
    );

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        context: ({ req, res }): MyContext => ({ em: orm.em, req, res })
    });

    // Creating a graphql endpoint
    apolloServer.applyMiddleware({ app })

    const port = process.env.PORT || 4000

    app.listen(port, () => {
        console.log('Server started on localhost:', port)
    });
};

main().catch(err => {
    console.log(err) 
});