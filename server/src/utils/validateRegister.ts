import { UserNamePasswordInput } from "../resolvers/UserNamePasswordInput";

export const validateRegister = ( options: UserNamePasswordInput ) => {
    
    if (!options.email.includes('@')) {
        return [{
            field: "email",
            message: "Invalid email."
        }]
    };

    if (options.username.includes("@")) {
        return [{
            field: "username",
            message: "Username must not include @"
        }]
    };

    if (options.username.length <= 2) {
        return [{
            field: "username",
            message: "Username length must be longer than 2 characters."
        }]
    };

    if (options.password.length <= 3) {
        return [{
            field: "password",
            message: "Password length must be longer than 3 characters."
        }]
    }; 

    return null;
};