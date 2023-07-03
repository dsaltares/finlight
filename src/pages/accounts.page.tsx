import type { NextPage } from 'next';
import Typography from '@mui/material/Typography';
import WithAuthentication from '@components/WithAuthentication';

const AccountsPage: NextPage = () => (
  <Typography variant="h4" component="h1">
    Accounts
  </Typography>
);

export default WithAuthentication(AccountsPage);
