import { FormControl, FormLabel, Input, FormErrorMessage, Textarea } from '@chakra-ui/react';
import { useField } from 'formik';
import React, { HTMLAttributes } from 'react'

// Allow input field component to take any props that a regular input field would take
type InputFieldProps = HTMLAttributes<HTMLInputElement> & {
    label: string;
    name: string;
    textarea?: boolean;
};

export const InputField: React.FC<InputFieldProps> = ({label, textarea, ...props}) => {
        let InputOrTextArea = Input

        if (textarea) {
            InputOrTextArea = Textarea
        }

        const [field, {error}] = useField(props);

        return (
            <FormControl isInvalid={!!error}>
                <FormLabel htmlFor={field.name}>{label}</FormLabel>
                <InputOrTextArea 
                    id={field.name} 
                    {...field} 
                    {...props}
                    />
                { error && <FormErrorMessage>{error}</FormErrorMessage> }
            </FormControl>
        );
}