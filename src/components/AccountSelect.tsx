import { useMemo } from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import type { Account } from '@server/account/types';

type Props = {
  accounts: Account[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

const id = 'account-select';

const AccountSelect = ({ accounts, selected, onChange }: Props) => {
  const accountsById = useMemo(
    () =>
      accounts.reduce<Record<string, Account>>(
        (acc, account) => ({ ...acc, [account.id]: account }),
        {}
      ),
    [accounts]
  );
  return (
    <FormControl fullWidth>
      <InputLabel id={`${id}-label`}>Accounts</InputLabel>
      <Select
        multiple
        label="Accounts"
        id={id}
        labelId={`${id}-label`}
        value={selected}
        onChange={({ target: { value } }) =>
          onChange(typeof value === 'string' ? value.split(',') : value)
        }
        renderValue={(values) =>
          values.map((value) => accountsById[value].name).join(', ')
        }
      >
        {accounts.map((account) => (
          <MenuItem key={account.id} value={account.id}>
            <Checkbox checked={selected.indexOf(account.id) > -1} />
            <ListItemText primary={account.name} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default AccountSelect;
