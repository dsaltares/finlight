import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

const FullScreenSpinner = () => (
  <Stack width="100%" height="100%" justifyContent="center" alignItems="center">
    <CircularProgress />
  </Stack>
);

export default FullScreenSpinner;
