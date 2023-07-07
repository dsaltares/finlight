import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Link from 'next/link';
import stringToColor from 'string-to-color';
import Routes from '@lib/routes';
import type { Account } from '@server/account/types';
import flags from '@lib/flags';
import { formatAmount } from '@lib/format';

type Props = {
  account: Account;
  onUpdate: (id: string) => void;
  onDelete: (id: string) => void;
};

const AccountListItem = ({ account, onUpdate, onDelete }: Props) => (
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
        secondary={formatAmount(account.balance, account.currency)}
      />
      <Stack direction="row" gap={1}>
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
  </ListItem>
);

export default AccountListItem;
