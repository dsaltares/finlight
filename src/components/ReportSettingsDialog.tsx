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
import useFiltersFromurl from '@lib/useFiltersFromUrl';
import type { Account } from '@server/account/types';
import { currencyOptionsById } from '@lib/autoCompleteOptions';
import type { TimeGranularity } from '@server/reports/types';
import PeriodSelect, {
  type Period,
  getPeriodForDateRange,
  getDateRangeForPeriod,
} from './PeriodSelect';
import AccountSelect from './AccountSelect';
import CurrencyAutocomplete from './CurrencyAutocomplete';
import TimeGranularitySelect from './TimeGranularitySelect';

type Props = {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
};

const id = 'report-filter-dialog';
const DefaultCurrency = 'EUR';
const DefaultGranularity: TimeGranularity = 'Monthly';

const ReportSettingsDialog = ({ open, onClose, accounts }: Props) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { filtersByField, setFilters } = useFiltersFromurl();
  const [dateRange, setDateRange] = useState(() =>
    filtersByField.date
      ? filtersByField.date
          .split(',')
          .map((date) => (date ? new Date(date) : null))
      : [null, null]
  );
  const [period, setPeriod] = useState<Period | ''>(
    getPeriodForDateRange(dateRange)
  );
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity | ''>(
    (filtersByField.timeGranularity as TimeGranularity) ?? ''
  );
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
    filtersByField.accounts ? filtersByField.accounts.split(',') : []
  );
  const [currency, setCurrency] = useState(
    currencyOptionsById[filtersByField.currency ?? DefaultCurrency]
  );

  const handleApplyFilters = () => {
    setFilters({
      date: dateRange.some((date) => !!date)
        ? dateRange.map((date) => (date ? date.toISOString() : '')).join(',')
        : undefined,
      accounts:
        selectedAccounts.length > 0 && selectedAccounts.length < accounts.length
          ? selectedAccounts.join(',')
          : undefined,
      currency: currency.id !== DefaultCurrency ? currency.id : undefined,
      timeGranularity:
        timeGranularity === DefaultGranularity ? undefined : timeGranularity,
    });
    onClose();
  };

  const handleClearFilters = () => {
    setFilters({
      date: undefined,
      accounts: undefined,
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
                setDateRange(getDateRangeForPeriod(period));
              }}
            />
            <Stack direction="row" gap={1}>
              <DatePicker
                label="From"
                value={dateRange[0]}
                onChange={(date) => {
                  const newRange = [date, dateRange[1]];
                  setDateRange(newRange);
                  setPeriod(getPeriodForDateRange(newRange));
                }}
                maxDate={dateRange[1]}
                format="dd/MM/yyyy"
                sx={{ width: '100%' }}
              />
              <DatePicker
                label="Until"
                value={dateRange[1]}
                onChange={(date) => {
                  const newRange = [dateRange[0], date];
                  setDateRange(newRange);
                  setPeriod(getPeriodForDateRange(newRange));
                }}
                minDate={dateRange[0]}
                format="dd/MM/yyyy"
                sx={{ width: '100%' }}
              />
            </Stack>
          </Stack>
          <TimeGranularitySelect
            value={timeGranularity}
            onChange={setTimeGranularity}
          />
          <AccountSelect
            accounts={accounts}
            selected={selectedAccounts}
            onChange={setSelectedAccounts}
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

export default ReportSettingsDialog;
