import { Link } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql"
import { Layout } from "../components/Layout";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from "next/link";

const Index = () => {
  const [{data}] = usePostsQuery();
  return (
    <Layout>
      <Link>
        <NextLink  href="/create-post" >
          Create Post
        </NextLink>
      </Link>
      <br />
      {
        !data ? 
        <div>...loading</div>
        : data.posts.map(
          post => (
            <div key={post.id} >
              {post.title}
            </div>
          )
        )
      }
    </Layout>
)}

export default withUrqlClient(createUrqlClient, {ssr: true})(Index);
