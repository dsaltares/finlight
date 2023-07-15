import { signIn } from 'next-auth/react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import EmailIcon from '@mui/icons-material/Email';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import { useRouter } from 'next/router';
import WithNoAuthentication from '@components/WithNoAuthentication';
import EmailRegexp from '@lib/emailRegexp';
import AppName from '@lib/appName';
import AuthCard from '@components/AuthCard';

// Default list of messages
// Documentation: https://next-auth.js.org/configuration/pages#error-codes
// Example: https://github.com/nextauthjs/next-auth/blob/82447f8e3ebc7004cf91121725b4f5970d2276d8/src/core/pages/signin.tsx#L42
const ErrorMessages: Record<string, string> = {
  Signin: 'Try signing in with a different account.',
  OAuthSignin: 'Try signing in with a different account.',
  OAuthCallback: 'Try signing in with a different account.',
  OAuthCreateAccount: 'Try signing in with a different account.',
  EmailCreateAccount: 'Try signing in with a different account.',
  Callback: 'Try signing in with a different account.',
  OAuthAccountNotLinked:
    'To confirm your identity, sign in with the same account you used originally.',
  EmailSignin: 'The e-mail could not be sent.',
  CredentialsSignin:
    'Sign in failed. Check the details you provided are correct.',
  SessionRequired: 'Please sign in to access this page.',
  default: 'Unable to sign in.',
};

const SignInPage = () => {
  const { query } = useRouter();
  const error = query.error ? query.error.toString() : undefined;
  const callbackUrl = query.callbackUrl
    ? query.callbackUrl.toString()
    : undefined;
  return (
    <AuthCard title={`Sign in to ${AppName}`}>
      {!!error && (
        <Alert severity="error" sx={{ width: '100%' }}>
          {ErrorMessages[error] || ErrorMessages.default}
        </Alert>
      )}
      <EmailForm callbackUrl={callbackUrl} />
    </AuthCard>
  );
};

type EmailFormValues = {
  email: string;
};

type EmailFormProps = {
  callbackUrl?: string;
};

export default WithNoAuthentication(SignInPage);

const EmailForm = ({ callbackUrl }: EmailFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormValues>({ mode: 'onBlur' });
  const onSubmit: SubmitHandler<EmailFormValues> = ({ email }) =>
    signIn('email', { email, callbackUrl });

  return (
    <Stack
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      gap={2}
      width="100%"
    >
      <TextField
        id="signin-email"
        placeholder="Email address..."
        type="text"
        {...register('email', {
          pattern: EmailRegexp,
          required: true,
        })}
        error={!!errors.email}
        fullWidth
      />
      <Button
        type="submit"
        variant="contained"
        startIcon={<EmailIcon />}
        fullWidth
      >
        Sign in
      </Button>
    </Stack>
  );
};
