import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { useState } from 'react';
import startOfDay from 'date-fns/startOfDay';
import endOfDay from 'date-fns/endOfDay';
import createUTCDate from '@lib/createUTCDate';
import useFiltersFromUrl from '@lib/useFiltersFromUrl';
import type { Account } from '@server/account/types';
import { currencyOptionsById } from '@lib/autoCompleteOptions';
import type { TimeGranularity } from '@server/reports/types';
import { isPeriod, type Period } from '@server/types';
import type { Category } from '@server/category/types';
import PeriodSelect from './PeriodSelect';
import AccountSelect from './AccountSelect';
import CurrencyAutocomplete from './CurrencyAutocomplete';
import TimeGranularitySelect from './TimeGranularitySelect';
import CategorySelect from './CategorySelect';

type Props = {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
};

const id = 'report-filter-dialog';
const DefaultCurrency = 'EUR';
const DefaultGranularity: TimeGranularity = 'Monthly';

const ReportSettingsDialog = ({
  open,
  onClose,
  accounts,
  categories,
}: Props) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { filtersByField, setFilters } = useFiltersFromUrl();
  const [from, setFrom] = useState(
    typeof filtersByField.from === 'string'
      ? createUTCDate(filtersByField.from)
      : null,
  );
  const [until, setUntil] = useState(
    typeof filtersByField.until === 'string'
      ? createUTCDate(filtersByField.until)
      : null,
  );
  const [period, setPeriod] = useState<Period | ''>(
    isPeriod(filtersByField.period) ? filtersByField.period : '',
  );
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity | ''>(
    (filtersByField.timeGranularity as TimeGranularity) ?? '',
  );
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
    filtersByField.accounts ? filtersByField.accounts.split(',') : [],
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    filtersByField.categories ? filtersByField.categories.split(',') : [],
  );
  const [currency, setCurrency] = useState(
    currencyOptionsById[filtersByField.currency ?? DefaultCurrency],
  );

  const handleApplyFilters = () => {
    setFilters({
      period: period || undefined,
      from: from ? startOfDay(from).toISOString() : undefined,
      until: until ? endOfDay(until).toISOString() : undefined,
      accounts:
        selectedAccounts.length > 0 && selectedAccounts.length < accounts.length
          ? selectedAccounts.join(',')
          : undefined,
      categories:
        selectedCategories.length > 0 &&
        selectedCategories.length < categories.length
          ? selectedCategories.join(',')
          : undefined,
      currency: currency.id !== DefaultCurrency ? currency.id : undefined,
      timeGranularity:
        timeGranularity === DefaultGranularity ? undefined : timeGranularity,
    });
    onClose();
  };

  const handleClearFilters = () => {
    setFilters({
      from: undefined,
      until: undefined,
      period: undefined,
      accounts: undefined,
      categories: undefined,
      currency: undefined,
      timeGranularity: undefined,
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
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id={`${id}-title`}>Report settings</DialogTitle>
      <DialogContent>
        <Stack paddingY={1} gap={1.75}>
          <Stack gap={1}>
            <PeriodSelect
              id="period-select"
              label="Period"
              value={period}
              onChange={(period) => {
                setPeriod(period);
                setFrom(null);
                setUntil(null);
              }}
            />
            <Stack direction="row" gap={1}>
              <DatePicker
                label="From"
                value={from}
                onChange={(date) => {
                  setFrom(date);
                  setPeriod('');
                }}
                maxDate={until}
                format="dd/MM/yyyy"
                sx={{ width: '100%' }}
              />
              <DatePicker
                label="Until"
                value={until}
                onChange={(date) => {
                  setUntil(date);
                  setPeriod('');
                }}
                minDate={from}
                format="dd/MM/yyyy"
                sx={{ width: '100%' }}
              />
            </Stack>
          </Stack>
          <AccountSelect
            accounts={accounts}
            selected={selectedAccounts}
            onChange={setSelectedAccounts}
          />
          <CategorySelect
            categories={categories}
            selected={selectedCategories}
            onChange={setSelectedCategories}
          />
          <TimeGranularitySelect
            value={timeGranularity}
            onChange={setTimeGranularity}
          />
          <CurrencyAutocomplete value={currency} onChange={setCurrency} />
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
          type="submit"
          variant="contained"
          color="secondary"
          onClick={handleApplyFilters}
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportSettingsDialog;
