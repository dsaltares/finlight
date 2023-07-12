import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import addDays from 'date-fns/addDays';
import addMonths from 'date-fns/addMonths';
import addYears from 'date-fns/addYears';
import endOfMonth from 'date-fns/endOfMonth';
import endOfYear from 'date-fns/endOfYear';
import startOfMonth from 'date-fns/startOfMonth';
import startOfToday from 'date-fns/startOfToday';
import startOfYear from 'date-fns/startOfYear';

export type Period =
  | 'last30Days'
  | 'last90Days'
  | 'currentMonth'
  | 'lastMonth'
  | 'last3Months'
  | 'currentYear'
  | 'lastYear'
  | 'custom';

const PeriodLabels: Record<Period, string> = {
  last30Days: 'Last 30 days',
  last90Days: 'Last 90 days',
  currentMonth: 'Current month',
  lastMonth: 'Last month',
  last3Months: 'Last 3 months',
  currentYear: 'Current year',
  lastYear: 'Last year',
  custom: 'Custom',
};

export const getDateRangeForPeriod = (period: Period | '') => {
  const now = new Date();
  const today = startOfToday();
  switch (period) {
    case 'last30Days':
      return [addDays(today, -30), now];
    case 'last90Days':
      return [addDays(today, -90), now];
    case 'currentMonth':
      return [startOfMonth(now), endOfMonth(now)];
    case 'lastMonth': {
      const oneMonthAgo = addMonths(now, -1);
      return [startOfMonth(oneMonthAgo), endOfMonth(oneMonthAgo)];
    }
    case 'last3Months': {
      const threeMonthsAgo = addMonths(now, -2);
      return [startOfMonth(threeMonthsAgo), endOfMonth(now)];
    }
    case 'currentYear':
      return [startOfYear(now), endOfYear(now)];
    case 'lastYear': {
      const oneYearAgo = addYears(now, -1);
      return [startOfYear(oneYearAgo), endOfYear(oneYearAgo)];
    }
    default:
      return [null, null];
  }
};

export const getPeriodForDateRange = ([from, to]: (Date | null)[]) => {
  if (!!from || !!to) {
    return 'custom';
  }
  return '';
};

type Props = {
  id: string;
  label: string;
  value: Period | '';
  onChange: (value: Period | '') => void;
};

const PeriodSelect = ({ id, label, value, onChange }: Props) => (
  <FormControl fullWidth>
    <InputLabel id={`${id}-label`}>{label}</InputLabel>
    <Select
      label="Period"
      id={id}
      labelId={`${id}-label`}
      value={value}
      onChange={(e) => onChange(e.target.value as Period | '')}
    >
      {Object.entries(PeriodLabels).map(([value, label]) => (
        <MenuItem key={value} value={value}>
          {label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

export default PeriodSelect;
