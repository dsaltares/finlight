import type { NextPage } from 'next';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import TuneIcon from '@mui/icons-material/Tune';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import WithAuthentication from '@components/WithAuthentication';
import useFiltersFromurl from '@lib/useFiltersFromUrl';
import CategorizedExpensesReport from '@components/Reports/CategorizedExpensesReport';
import CategorizedIncomeReport from '@components/Reports/CategorizedIncomeReport';
import useDialog from '@lib/useDialog';
import ReportSettingsDialog from '@components/ReportSettingsDialog';
import client from '@lib/api';
import IncomeVsExpensesReport from '@components/Reports/IncomeVsExpensesReport';
import AccountPositionsReport from '@components/Reports/AccountPositionsReport';

const Reports = {
  categorizedExpenses: {
    name: 'Where the money goes',
    Component: CategorizedExpensesReport,
  },
  categorizedIncome: {
    name: 'Where the money comes from',
    Component: CategorizedIncomeReport,
  },
  incomeVsExpenses: {
    name: 'Income vs Expenses',
    Component: IncomeVsExpensesReport,
  },
  accountPositions: {
    name: 'Account positions',
    Component: AccountPositionsReport,
  },
};

type Report = keyof typeof Reports;

const InsightsPage: NextPage = () => {
  const {
    open: isSettingsDialogOpen,
    onOpen: onSettingsDialogOpen,
    onClose: onSettingsDialogClose,
  } = useDialog('reportSettings');
  const { filtersByField, setFilters } = useFiltersFromurl();
  const { data } = client.getAccounts.useQuery();
  const numFilters = Object.keys(filtersByField).filter(
    (field) => field !== 'report'
  ).length;
  const report: Report =
    filtersByField.report && Reports.hasOwnProperty(filtersByField.report)
      ? (filtersByField.report as Report)
      : 'categorizedExpenses';
  const ReportComponent = Reports[report].Component;
  return (
    <Stack gap={2} height="100%">
      <Stack direction="row" gap={1} alignItems="center">
        <FormControl fullWidth>
          <InputLabel id="select-report-label">Report</InputLabel>
          <Select
            label="Report"
            id="select-report"
            labelId="select-report-label"
            value={report}
            onChange={(e) => setFilters({ report: e.target.value })}
          >
            {Object.entries(Reports).map(([value, { name }]) => (
              <MenuItem key={value} value={value}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Stack>
          <Badge badgeContent={numFilters} color="primary">
            <IconButton color="primary" onClick={onSettingsDialogOpen}>
              <TuneIcon />
            </IconButton>
          </Badge>
        </Stack>
      </Stack>
      <ReportComponent />
      {isSettingsDialogOpen && (
        <ReportSettingsDialog
          open={isSettingsDialogOpen}
          onClose={onSettingsDialogClose}
          accounts={data?.accounts || []}
        />
      )}
    </Stack>
  );
};

export default WithAuthentication(InsightsPage);
