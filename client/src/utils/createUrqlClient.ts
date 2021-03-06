import { cacheExchange, Resolver } from '@urql/exchange-graphcache';
import router from 'next/router';
import { dedupExchange, Exchange, fetchExchange, stringifyVariables } from "urql";
import { pipe, tap } from 'wonka';
import { LoginMutation, LogoutMutation, MeDocument, MeQuery, RegisterMutation } from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";

const errorExchange: Exchange = ({ forward }) => ops$ => {
  return pipe(
    forward(ops$),
    tap(({ error }) => {
      console.log({error})
      if (error?.message.includes("Not authenticated")) {
        router.replace("/login");
      }
    })
  );
};

export const cursorPagination = (): Resolver => {
  // returns a Resolver
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;
    // console.log({entityKey}, {fieldName}) -> Query, posts
    const allFields = cache.inspectFields(entityKey);
    // console.log({allFields})
    const fieldInfos = allFields.filter(info => info.fieldName === fieldName); // Making sure this is posts.
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    // check if the data is in the cache and then return the data
    // from the query, get the field key
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`
    const isItInTheCache = cache.resolve(cache.resolve(entityKey, fieldKey) as string, "posts");
    info.partial = !isItInTheCache;
    let hasMore = true;
    const results: string[] = [];
    fieldInfos.forEach( fi => {
      const key = cache.resolve(entityKey, fi.fieldKey) as string;
      const data = cache.resolve(key, 'posts') as string[];
      const _hasMore = cache.resolve(key, 'hasMore');
      if(!_hasMore) {
        hasMore = _hasMore as boolean;
      }
      results.push(...data)
    })

    return {
      // Invalid resolver value: The field at `Query.posts({"cursor":"","limit":10})` is a scalar (number, boolean, etc), but the GraphQL query 
      // expects a selection set for this field.
      // (Caused At: "Posts" query)
      //FIX
      __typename: "PaginatedPosts",
      hasMore,
      posts: results
    };
  };
};

export const createUrqlClient = ( ssrExchange: any ) => ({
    url: 'http://localhost:4000/graphql',
    fetchOptions: {
      credentials: 'include' as const,
    },
    exchanges: [ 
      dedupExchange, 
      cacheExchange({

        // urql-exchange-graphcache.mjs?1bf2:131 Invalid key: The GraphQL query at the field at `Query.posts({"cursor":"","limit":10})` 
        // has a selection set, but no key could be generated for the data at this field.
        // You have to request `id` or `_id` fields for all selection sets or create a custom `keys` config for `PaginatedPosts`.
        // Entities without keys will be embedded directly on the parent entity. If this is intentional, create a `keys` config for 
        // `PaginatedPosts` that always returns null.
        // FIX
        keys: {
          PaginatedPosts: () => null,
        },
        resolvers: {
          Query: {
            // name matches our post graphql
            posts:cursorPagination(),
          }
        },

        updates: {
          Mutation: {
            createPost: (_result, args, cache, info ) => {
              const allFields = cache.inspectFields('Query');
              const fieldInfos = allFields.filter(info => info.fieldName === 'posts'); // Making sure this is posts.
              fieldInfos.forEach((fi) => {
                cache.invalidate('Query', 'posts', fi.arguments || {});
              })
            },

            logout: (_result, args, cache, info ) => {
              betterUpdateQuery<LogoutMutation, MeQuery>(
                cache,
                {query: MeDocument},
                _result, 
                () => ({ me:null })
              );
            },
            
            login: ( _result, args, cache, info ) => {
              betterUpdateQuery<LoginMutation, MeQuery>(
                cache, 
                { query: MeDocument},
                _result,
                (result, query) => {
                  if (result.login.errors) {
                    return query
                  } else {
                    return {
                      me: result.login.user,
                    }
                  }
                }
              )
            },
  
            register: ( _result, args, cache, info ) => {
              betterUpdateQuery<RegisterMutation, MeQuery>(
                cache, 
                { query: MeDocument},
                _result,
                (result, query) => {
                  if (result.register.errors) {
                    return query
                  } else {
                    return {
                      me: result.register.user,
                    }
                  }
                }
              )
            }
          }
        }
      }, 
      ),
      // Order matters
      errorExchange,
      ssrExchange, 
      fetchExchange 
    ],
  });