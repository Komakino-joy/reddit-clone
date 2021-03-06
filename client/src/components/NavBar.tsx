import { Box, Button, Flex, Link } from '@chakra-ui/react';
import React from 'react'
import NextLink from "next/link"
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import { isServer } from '../utils/isServer';

interface NavBarProps {

}

export const NavBar: React.FC<NavBarProps> = ({}) => {
    const [{ fetching: logoutFetching }, logout] = useLogoutMutation()
        const [{data, fetching}] = useMeQuery({
            // Avoiding unecessary server calls. 
            pause: isServer(),
        });
        let body = null;

        if (fetching) {
            // data is loading
            body = null;
        } else if (!data?.me) {
            // user not logged in
            body  = (
                <>
                    <NextLink href="/login" >
                        <Link color={"white"} mr={2} >Login</Link>
                    </NextLink>
                    <NextLink href="/register" >
                        <Link color={"white"}>Register</Link>
                    </NextLink>
                </>
            )
        } else {
            // user is logged in
            body = (
                <Flex>
                    <Box mr={2} color={"white"} >{data.me.username}</Box>
                    <Button isLoading={logoutFetching} onClick={() => logout()} variant={'link'} color={"white"} >Log Out</Button>
                </Flex>
            )
        }

        return (
            <Flex zIndex={2} position={"sticky"} top={0} bg="tomato" p={4} >
                
                <Box ml={'auto'}>
                    {body}
                </Box>
            </Flex>
        );
}