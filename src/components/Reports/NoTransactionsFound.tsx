import SearchOffIcon from '@mui/icons-material/SearchOff';
import EmptyState from '@components/EmptyState';

const NoTransactionsFound = () => (
  <EmptyState Icon={SearchOffIcon}>No transactions found</EmptyState>
);
export default NoTransactionsFound;
