import { MikroORM} from '@mikro-orm/core';
import { __prod__ } from './constants';
import { Post } from './entities/Post';
import microConfig from './mikro-orm.config';

const main = async () => {
    // Connect to Database
    const orm = await MikroORM.init(microConfig);
    // Run Migrations
    await orm.getMigrator().up()
    // Run SQL
    // const post = orm.em.create(Post, { title: 'My first post' });
    // await orm.em.persistAndFlush(post);
    const posts = await orm.em.find(Post, {});
    console.log(posts)
};

main().catch(err => {
    console.log(err) 
});