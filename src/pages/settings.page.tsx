import type { NextPage } from 'next';
import Typography from '@mui/material/Typography';
import WithAuthentication from '@components/WithAuthentication';

const SettingsPage: NextPage = () => (
  <Typography variant="h4" component="h1">
    Settings
  </Typography>
);

export default WithAuthentication(SettingsPage);
