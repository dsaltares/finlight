import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import Link from 'next/link';
import stringToColor from 'string-to-color';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Routes from '@lib/routes';
import type { Account } from '@server/account/types';
import flags from '@lib/flags';
import { formatAmount } from '@lib/format';
import useImportTransactions from '@lib/transactions/useImportTransactions';

type Props = {
  account: Account;
  onUpdate: (id: string) => void;
  onDelete: (id: string) => void;
};

const AccountListItem = ({ account, onUpdate, onDelete }: Props) => {
  const {
    fileInputRef,
    handleUploadClick,
    handleFileSelected,
    isLoading: isImportingTransactions,
    canImport,
  } = useImportTransactions(account);

  return (
    <ListItem disableGutters>
      <ListItemButton
        component={Link}
        href={Routes.transactionsForAccount(account.id)}
      >
        <ListItemAvatar>
          <Avatar
            sx={{ backgroundColor: stringToColor(account.name) }}
            src={flags[account.currency.toLowerCase()]}
          >
            {account.name}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={account.name}
          secondary={
            <Typography
              variant="body2"
              color={account.balance > 0 ? 'success.main' : 'error.main'}
            >
              {formatAmount(account.balance, account.currency)}
            </Typography>
          }
        />
        <Stack direction="row" gap={1}>
          {canImport && (
            <IconButton
              onClick={(e) => {
                e.preventDefault();
                handleUploadClick();
              }}
              disabled={isImportingTransactions}
            >
              {isImportingTransactions ? (
                <CircularProgress size={24} />
              ) : (
                <FileUploadIcon />
              )}
            </IconButton>
          )}
          <IconButton
            onClick={(e) => {
              onUpdate(account.id);
              e.preventDefault();
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={(e) => {
              onDelete(account.id);
              e.preventDefault();
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      </ListItemButton>
      <input
        ref={fileInputRef}
        hidden
        type="file"
        accept="text/csv"
        onChange={handleFileSelected}
      />
    </ListItem>
  );
};

export default AccountListItem;
