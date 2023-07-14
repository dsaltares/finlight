import Stack from '@mui/material/Stack';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import Typography from '@mui/material/Typography';

const NoTransactionsFound = () => (
  <Stack padding={3} gap={1} alignItems="center">
    <SearchOffIcon fontSize="large" />
    <Typography>No transactions found</Typography>
  </Stack>
);

export default NoTransactionsFound;
