import { FormControl, FormLabel, Input, FormErrorMessage } from '@chakra-ui/react';
import { useField } from 'formik';
import React, { HTMLAttributes } from 'react'

// Allow input field component to take any props that a regular input field would take
type InputFieldProps = HTMLAttributes<HTMLInputElement> & {
    label: string;
    name: string;
    type?: string;
};

export const InputField: React.FC<InputFieldProps> = ({label,  ...props}) => {

        const [field, {error}] = useField(props);

        return (
            <FormControl isInvalid={!!error}>
                <FormLabel htmlFor={field.name}>{label}</FormLabel>
                <Input 
                    id={field.name} 
                    {...field} 
                    {...props}
                    />
                { error && <FormErrorMessage>{error}</FormErrorMessage> }
            </FormControl>
        );
}