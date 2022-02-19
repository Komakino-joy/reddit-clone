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
      console.log(error)
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
    const isItInTheCache = cache.resolve(entityKey, fieldKey)
    info.partial = !isItInTheCache;
    const results: string[] = [];
    fieldInfos.forEach( fi => {
      const data = cache.resolve(entityKey, fi.fieldKey) as string[];
      results.push(...data)
    })

    return results;
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
        resolvers: {
          Query: {
            // name matches our post graphql
            posts:cursorPagination(),
          }
        },

        updates: {
          Mutation: {
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