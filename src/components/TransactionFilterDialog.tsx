import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Autocomplete from '@mui/material/Autocomplete';
import { useMemo, useState } from 'react';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import useFiltersFromurl from '@lib/useFiltersFromUrl';
import type { Account } from '@server/account/types';
import type { Category } from '@server/category/types';
import { isOptionEqualToValue } from '@lib/autoCompleteOptions';

type Props = {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
};

const id = 'transaction-filter-dialog';

const TransactionFilterDialog = ({
  open,
  onClose,
  accounts,
  categories,
}: Props) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { filtersByColumnId, setFilters } = useFiltersFromurl();
  const accountOptions = useMemo(
    () =>
      accounts.map((account) => ({
        label: account.name,
        id: account.id,
      })),
    [accounts]
  );
  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        label: category.name,
        id: category.id,
      })),
    [categories]
  );
  const [account, setAccount] = useState(
    () =>
      accountOptions.find(
        (option) => option.id === filtersByColumnId.accountId
      ) || null
  );
  const [category, setCategory] = useState(
    () =>
      categoryOptions.find(
        (option) => option.id === filtersByColumnId.categoryId
      ) || null
  );
  const [description, setDescription] = useState(filtersByColumnId.description);
  const [dateRange, setDateRange] = useState(() =>
    filtersByColumnId.date
      ? filtersByColumnId.date
          .split(',')
          .map((date) => (date ? new Date(date) : null))
      : [null, null]
  );
  const [amountRange, setAmountRange] = useState(() =>
    filtersByColumnId.amount ? filtersByColumnId.amount.split(',') : ['', '']
  );
  const handleApplyFilters = () => {
    setFilters({
      date: dateRange.some((date) => !!date)
        ? dateRange.map((date) => (date ? date.toISOString() : '')).join(',')
        : undefined,
      amount: amountRange.some((amount) => !!amount)
        ? amountRange.join(',')
        : undefined,
      accountId: account?.id,
      categoryId: category?.id,
      description: description || undefined,
    });
    onClose();
  };

  const handleClearFilters = () => {
    setFilters({
      date: undefined,
      amount: undefined,
      accountId: undefined,
      categoryId: undefined,
      description: undefined,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      id={id}
      aria-labelledby={`${id}-title`}
      fullScreen={fullScreen}
      keepMounted={false}
    >
      <DialogTitle id={`${id}-title`}>Transaction filters</DialogTitle>
      <DialogContent>
        <Stack paddingY={1} gap={1.5}>
          <Stack direction="row" gap={0.5}>
            <DatePicker
              label="From"
              value={dateRange[0]}
              onChange={(date) => setDateRange([date, dateRange[1]])}
              maxDate={dateRange[1]}
              format="dd/MM/yyyy"
            />
            <DatePicker
              label="Until"
              value={dateRange[1]}
              onChange={(date) => setDateRange([dateRange[0], date])}
              minDate={dateRange[0]}
              format="dd/MM/yyyy"
            />
          </Stack>
          <Stack direction="row" gap={0.5}>
            <TextField
              fullWidth
              type="number"
              label="Min amount"
              value={amountRange[0]}
              onChange={(e) => setAmountRange([e.target.value, amountRange[1]])}
              inputProps={{
                step: 0.01,
              }}
            />
            <TextField
              fullWidth
              type="number"
              label="Max amount"
              value={amountRange[1]}
              onChange={(e) => setAmountRange([amountRange[0], e.target.value])}
              inputProps={{
                step: 0.01,
              }}
            />
          </Stack>
          <Autocomplete
            id="account-autocomplete"
            value={account}
            onChange={(_event, newValue) => setAccount(newValue)}
            options={accountOptions}
            isOptionEqualToValue={isOptionEqualToValue}
            renderInput={(params) => <TextField {...params} label="Account" />}
          />
          <Autocomplete
            id="category-autocomplete"
            value={category}
            onChange={(_event, newValue) => setCategory(newValue)}
            options={categoryOptions}
            isOptionEqualToValue={isOptionEqualToValue}
            renderInput={(params) => <TextField {...params} label="Category" />}
          />
          <TextField
            label="Description"
            defaultValue={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="outlined" color="error" onClick={handleClearFilters}>
          Clear
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleApplyFilters}
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionFilterDialog;
