import { FormControl, FormLabel, Input, FormErrorMessage } from '@chakra-ui/react';
import { useField } from 'formik';
import React, { HTMLAttributes } from 'react'

// Allow input field component to take any props that a regular input field would take
type InputFieldProps = HTMLAttributes<HTMLInputElement> & {
    name: string;
    label: string;
    placeholder: string;
    type?: string;
};

export const InputField: React.FC<InputFieldProps> = (props) => {

        const [field, {error}] = useField(props);

        return (
            <FormControl isInvalid={!!error}>
                <FormLabel htmlFor={field.name}>{props.label}</FormLabel>
                <Input {...field} id={field.name} placeholder={props.placeholder} type={props.type}/>
                { error && <FormErrorMessage>{error}</FormErrorMessage> }
            </FormControl>
        );
}