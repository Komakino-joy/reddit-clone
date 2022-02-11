import { MikroORM} from '@mikro-orm/core';
import { __prod__ } from './constants';
// import { Post } from './entities/Post';
import microConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';

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

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver],
            validate: false
        }),
        context: () => ({ em: orm.em })
    });

    // Creating a graphql endpoint
    apolloServer.applyMiddleware({ app })

    app.listen(4000, () => {
        console.log('Server started on localhost:6000')
    });
};

main().catch(err => {
    console.log(err) 
});