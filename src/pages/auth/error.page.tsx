import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useRouter } from 'next/router';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import Routes from '@lib/routes';
import WithNoAuthentication from '@components/WithNoAuthentication';
import AuthCard from '@components/AuthCard';

const Messages: Record<string, string> = {
  Configuration: 'The application is misconfigured, please contact support.',
  AccessDenied: 'Your account has been blocked, please contact support.',
  Verification:
    'The sign in link is no longer valid. It may have been used or it may have expired.',
  Default: 'Something went wrong, please try again.',
};

const ErrorPage = () => {
  const { query } = useRouter();
  const error = query.error ? query.error.toString() : '';
  return (
    <AuthCard
      title="Unable to sign in"
      icon={<WarningAmberIcon fontSize="large" />}
    >
      <Typography variant="body1">
        {Messages[error] || Messages.Default}
      </Typography>
      <Stack justifyContent="center">
        <Button
          startIcon={<ArrowForwardIcon />}
          component={Link}
          href={Routes.signIn}
          variant="contained"
        >
          Sign in
        </Button>
      </Stack>
    </AuthCard>
  );
};

export default WithNoAuthentication(ErrorPage);
