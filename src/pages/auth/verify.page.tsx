import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import Link from 'next/link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Routes from '@lib/routes';
import WithNoAuthentication from '@components/WithNoAuthentication';
import AuthCard from '@components/AuthCard';

const VerifyPage = () => (
  <AuthCard title="Check your email">
    <Typography variant="body1">
      We just emailed you a link that will log you in securely.
    </Typography>
    <Stack justifyContent="center">
      <Button
        startIcon={<ArrowBackIcon />}
        component={Link}
        href={Routes.signIn}
        variant="contained"
      >
        Back
      </Button>
    </Stack>
  </AuthCard>
);

export default WithNoAuthentication(VerifyPage);
