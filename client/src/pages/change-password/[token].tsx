import { NextPage } from 'next';

const ChangePassword: NextPage<{ token: string }> = ({ token }) => {
        return (
            <div>
                token is : {token}
            </div>
        );
};

ChangePassword.getInitialProps = ({query}) => {
    return {
        // Get token from the url
        token: query.token as string
    }
};

export default ChangePassword;