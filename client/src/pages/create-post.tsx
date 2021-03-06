import { Box, Button } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/router';
import React from 'react'
import { InputField } from '../components/InputField';
import { Layout } from '../components/Layout';
import { useCreatePostMutation } from '../generated/graphql';
import { useIsAuth } from '../hooks/useIsAuth';
import { createUrqlClient } from '../utils/createUrqlClient';

const CreatePost: React.FC<{}> = ({}) => {
        const router = useRouter();
        useIsAuth();
        const[{}, createPost] = useCreatePostMutation();
        return (
            <Layout variant='small'>
            <Formik 
                initialValues={ { title: "", text: "" }} 
                onSubmit={ 
                    async (values) => {
                        const {error} = await createPost({input: values});
                        if(!error) {
                            router.push("/");
                        }
                    }
                }
            >
                {({ isSubmitting} ) => (
                    <Form>
                        <InputField
                            name = "title"
                            placeholder='title'
                            label='Title'
                        />
                        <Box mt={4}>
                            <InputField
                                textarea
                                name = "text"
                                placeholder='text...'
                                label='Body'
                            />
                        </Box>
                        <Button type='submit'  color={'white'} isLoading={isSubmitting} background={'teal'} mt={4}> Create Post </Button>
                    </Form>
                )}
            </Formik>
        </Layout>
        );
}

export default  withUrqlClient(createUrqlClient)(CreatePost)