import { Box, Button, Flex, Link } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { NextPage } from 'next';
import { withUrqlClient } from 'next-urql';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { InputField } from '../../components/InputField';
import { Wrapper } from '../../components/Wrapper';
import { useChangePasswordMutation } from '../../generated/graphql';
import { createUrqlClient } from '../../utils/createUrqlClient';
import { toErrorMap } from '../../utils/toErrorMap';

const ChangePassword: NextPage = () => {
        const router = useRouter();
        const [{}, changePassword ] = useChangePasswordMutation();
        const [tokenError, setTokenError] = useState('');
        return (
            <Wrapper variant='small'>
                <Formik 
                    initialValues={ { newPassword:"" }} 
                    onSubmit={ 
                        async (values, {setErrors}) => {
                            const response = await changePassword({ 
                                newPassword: values.newPassword, 
                                token: typeof router.query.token === "string" ? router.query.token : '', 
                            });
                            if (response.data?.changePassword.errors) {
                                const errorMap = toErrorMap(response.data.changePassword.errors);
                                
                                if ('token' in errorMap) {
                                    setTokenError(errorMap.token)
                                }

                                setErrors(errorMap);

                            } else if (response.data?.changePassword.user) {
                                // worked
                                router.push("/");
                            }
                        }
                    }
                >
                    {({ isSubmitting} ) => (
                        <Form>
                            <InputField
                                name = "newPassword"
                                placeholder='New Password'
                                label='New Password'
                                type="password"
                            />
                            { tokenError &&
                                <Flex>
                                    <Box mr={2} color='red' > {tokenError} </Box>
                                    <NextLink href={"/forgot-password"} >
                                        <Link> Forgot password </Link>
                                    </NextLink>
                                </Flex>
                            }
                            <Button type='submit'  color={'white'} isLoading={isSubmitting} background={'teal'} mt={4}> Change Password </Button>
                        </Form>
                    )}
                </Formik>
            </Wrapper>
        );
};

// Note make sure to add wuthUrqlClient any time we use a mutation or a query.
export default  withUrqlClient(createUrqlClient)(ChangePassword);