import type { NextPage } from 'next';
import Typography from '@mui/material/Typography';
import WithAuthentication from '@components/WithAuthentication';

const InsightsPage: NextPage = () => (
  <Typography variant="h4" component="h1">
    Insights
  </Typography>
);

export default WithAuthentication(InsightsPage);
