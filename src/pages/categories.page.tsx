import type { NextPage } from 'next';
import Typography from '@mui/material/Typography';
import WithAuthentication from '@components/WithAuthentication';

const CategoriesPage: NextPage = () => (
  <Typography variant="h4" component="h1">
    Categories
  </Typography>
);

export default WithAuthentication(CategoriesPage);
