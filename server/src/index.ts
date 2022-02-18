// needed for typeorm to work
import "reflect-metadata";
import { __prod__ } from './constants';
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

import { createConnection } from 'typeorm';
import { User } from "./entities/User";
import { Post } from "./entities/Post";
import path from "path";

declare module 'express-session' {
  export interface SessionData {
    user: { [key: string]: any };
  }
}
// re-run save
const main = async () => {
    // Connect to Database
     const conn = await createConnection({
      type: 'postgres',
      database: 'reddit-clone2',
      username: 'postgres',
      password: 'postgres',
      logging: true,
      synchronize: true,
      migrations: [path.join(__dirname, ".migrations/*")],
      entities: [Post, User]
    });

    await conn.runMigrations()

    const app = express();

    const RedisStore = connectRedis(session);
    const redis = new Redis(process.env.REDIS_URL || "localhost:6379");
    app.set("trust proxy", 1);
    app.use(
      cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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
        // variables in the context can be accessed in my resolvers
        context: ({ req, res }): MyContext => ({ req, res, redis })
    });

    // Creating a graphql endpoint
    apolloServer.applyMiddleware({ app, cors: false })

    const port = process.env.PORT || 4000

    app.listen(port, () => {
        console.log('Server started on localhost:', port)
    });
};

main().catch(err => {
    console.log(err) 
});