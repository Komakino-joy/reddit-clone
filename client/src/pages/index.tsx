import { Box, Button, Flex, Heading, Icon, IconButton, Link, Stack, Text } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql"
import { Layout } from "../components/Layout";
import { usePostsQuery, useVoteMutation } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from "next/link";
import { useState } from "react";
import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";


const Index = () => {
  const [loadingState, setLoadingState] = useState<"upvote-loading" | "downvote-loading" | "not-loading">("not-loading");
  const [{}, vote] = useVoteMutation()

  const [variables, setVariables] = useState({
    limit: 15,
    cursor: ''
  })

  const [{data, fetching }] = usePostsQuery({ variables });

  if (!fetching && !data) {
    return <div>Something went wrong, nothing to show.</div>
  };

  return (
    <Layout>
      <Flex align={'center'} >
          <Heading>B-Raddit</Heading> 
          <NextLink  href="/create-post" >
            <Link ml={'auto'} >
                Create Post
            </Link>
          </NextLink>
      </Flex>
      <br />
      {
        !data  && fetching ? 
        <div>...loading</div>
        : (
          <Stack spacing={8}>
        { 
          data?.posts.posts.map(post => (
            <Flex key={post.id} p={5} shadow='md' borderWidth='1px'>
                <Flex direction={"column"} justifyContent={"center"}  alignItems={"center"} mr={4} >
                  <IconButton  onClick={ async () => {
                    setLoadingState("upvote-loading")
                    await vote({
                      postId: post.id,
                      value: 1
                    })
                    setLoadingState("not-loading")
                  }} isLoading={loadingState === 'upvote-loading'} aria-label="upvote post" as={ ChevronUpIcon }  w={3} h={5}/>
                    {post.points}
                  <IconButton onClick={ async () => {
                    setLoadingState("downvote-loading")
                    await vote({
                      postId: post.id,
                      value: -1
                    })
                    setLoadingState("not-loading")
                  }} isLoading={loadingState === 'downvote-loading'}  aria-label="downvote post" as={ ChevronDownIcon}  w={3} h={5}/>
                </Flex>
                <Box>
                  <Heading fontSize='xl'>{post.title}</Heading> 
                  <Text>posted by { post.creator.username }</Text>
                  <Text mt={4}>{post.textSnippet}</Text>
                </Box>
            </Flex>
            ))
        }
        </Stack>
        
          )
      }
      {
        data && data.posts.hasMore &&
        <Flex >
          <Button onClick={() => 
                setVariables({ 
                  limit: variables.limit,
                  cursor: data.posts.posts[data.posts.posts.length - 1].createdAt, 
                }
                  )} 
          isLoading={fetching} m={"auto"} my={8}>Load more</Button>
        </Flex>
      }
    </Layout>
)}

export default withUrqlClient(createUrqlClient, {ssr: true})(Index);
