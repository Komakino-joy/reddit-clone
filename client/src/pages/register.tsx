import React from 'react';
import { Form, Formik } from 'formik';
import { Box, Button } from '@chakra-ui/react';
import { Wrapper } from '../components/Wrapper';
import { InputField } from '../components/InputField';
import { useRegisterMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';
import { useRouter } from 'next/router';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';

interface registerProps {

};

export const Register: React.FC<registerProps> = ({}) => {
        const router = useRouter();
        const [{}, register] = useRegisterMutation();

        return (
            <Wrapper variant='small'>
                <Formik 
                    initialValues={ { email: "", username: "", password: "" }} 
                    onSubmit={ 
                        async (values, {setErrors}) => {
                            const response = await register({options: values});
                            if (response.data?.register.errors) {
                                setErrors(toErrorMap(response.data.register.errors))
                            } else if (response.data?.register.user) {
                                // worked
                                router.push("/");
                            }
                        }
                    }
                >
                    {({ isSubmitting} ) => (
                        <Form>
                            <InputField
                                name = "username"
                                placeholder='username'
                                label='username'
                            />
                            <Box mt={4}>
                                <InputField
                                    name = "email"
                                    placeholder='email'
                                    label='Email'
                                    type='email'
                                />
                            </Box>
                            <Box mt={4}>
                                <InputField
                                    name = "password"
                                    placeholder='password'
                                    label='Password'
                                    type='password'
                                />
                            </Box>
                            <Button type='submit'  color={'white'} isLoading={isSubmitting} background={'teal'} mt={4}> Register </Button>
                        </Form>
                    )}
                </Formik>
            </Wrapper>
        );
};

// urqlClient required so we can run our mutations on this page
export default withUrqlClient(createUrqlClient)(Register)