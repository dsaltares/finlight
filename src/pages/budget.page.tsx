import type { NextPage } from 'next';
import Typography from '@mui/material/Typography';
import WithAuthentication from '@components/WithAuthentication';

const BudgetPage: NextPage = () => (
  <Typography variant="h4" component="h1">
    Budget
  </Typography>
);

export default WithAuthentication(BudgetPage);
