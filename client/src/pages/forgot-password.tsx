import { Box, Button } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { withUrqlClient } from 'next-urql';
import React, { useState } from 'react'
import { InputField } from '../components/InputField';
import { Wrapper } from '../components/Wrapper';
import { useForgotPasswordMutation } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';


const ForgotPassword: React.FC<{}> = ({}) => {
        const [complete, setComplete] = useState(false);
        const [{}, forgotPassword] = useForgotPasswordMutation()

        return (
            <Wrapper variant='small'>
            <Formik 
                initialValues={ { email: "" }} 
                onSubmit={ async (values) => {
                    await forgotPassword(values);
                    setComplete(true);
                }}
            >
                {({ isSubmitting} ) => ( 
                    complete ? <Box>If an account with that email exists, an email will be sent.</Box> 
                    :
                    <Form>
                        <InputField
                            name = "email"
                            placeholder='Email'
                            label='Email'
                            type="email"
                        />
                        <Button 
                            type='submit'  
                            color={'white'} 
                            isLoading={isSubmitting} 
                            background={'teal'} 
                            mt={4}
                        > 
                            Forgot password 
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
        );
}

export default  withUrqlClient(createUrqlClient)(ForgotPassword)