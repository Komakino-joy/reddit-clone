"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const constants_1 = require("./constants");
const express_1 = __importDefault(require("express"));
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const hello_1 = require("./resolvers/hello");
const post_1 = require("./resolvers/post");
const user_1 = require("./resolvers/user");
const ioredis_1 = __importDefault(require("ioredis"));
const express_session_1 = __importDefault(require("express-session"));
const connect_redis_1 = __importDefault(require("connect-redis"));
const cors_1 = __importDefault(require("cors"));
const typeorm_1 = require("typeorm");
const User_1 = require("./entities/User");
const Post_1 = require("./entities/Post");
const path_1 = __importDefault(require("path"));
const UpVote_1 = require("./entities/UpVote");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, typeorm_1.createConnection)({
        type: 'postgres',
        database: 'reddit-clone2',
        username: 'postgres',
        password: 'postgres',
        logging: true,
        synchronize: true,
        migrations: [path_1.default.join(__dirname, ".migrations/*")],
        entities: [Post_1.Post, User_1.User, UpVote_1.UpVote]
    });
    yield conn.runMigrations();
    const app = (0, express_1.default)();
    const RedisStore = (0, connect_redis_1.default)(express_session_1.default);
    const redis = new ioredis_1.default(process.env.REDIS_URL || "localhost:6379");
    app.set("trust proxy", 1);
    app.use((0, cors_1.default)({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    }));
    app.use((0, express_session_1.default)({
        name: 'qid',
        store: new RedisStore({
            client: redis,
            disableTouch: true,
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
            httpOnly: true,
            sameSite: "lax",
            secure: constants_1.__prod__,
        },
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET || 'SecretDevelopmentKey',
        resave: false,
    }));
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema: yield (0, type_graphql_1.buildSchema)({
            resolvers: [hello_1.HelloResolver, post_1.PostResolver, user_1.UserResolver],
            validate: false
        }),
        context: ({ req, res }) => ({ req, res, redis })
    });
    apolloServer.applyMiddleware({ app, cors: false });
    const port = process.env.PORT || 4000;
    app.listen(port, () => {
        console.log('Server started on localhost:', port);
    });
});
main().catch(err => {
    console.log(err);
});
//# sourceMappingURL=index.js.map