import type { NextPage } from 'next';
import Typography from '@mui/material/Typography';
import WithAuthentication from '@components/WithAuthentication';

const TransactionsPage: NextPage = () => (
  <Typography variant="h4" component="h1">
    Transactions
  </Typography>
);

export default WithAuthentication(TransactionsPage);
