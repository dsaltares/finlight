import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import ChartContainer from '@components/Reports/ChartContainer';
import client from '@lib/api';
import useFiltersFromurl from '@lib/useFiltersFromUrl';
import { formatAmount } from '@lib/format';
import type { TimeGranularity } from '@server/reports/types';
import NoTransactionsFound from './NoTransactionsFound';

const IncomeVsExpensesReport = () => {
  const theme = useTheme();
  const { filtersByField } = useFiltersFromurl();
  const { data } = client.getIncomeVsExpensesReport.useQuery({
    accounts: filtersByField.accounts?.split(','),
    currency: filtersByField.currency,
    granularity: filtersByField.timeGranularity as TimeGranularity,
  });

  const currency = filtersByField.currency || 'EUR';
  const content =
    data && data.length > 0 ? (
      <>
        <Grid xs={12} md={8}>
          <ChartContainer>
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" />
              <YAxis />
              <Tooltip
                formatter={(value) => formatAmount(value as number, currency)}
              />
              <Bar dataKey="income" fill={theme.palette.success.light} />
              <Bar dataKey="expenses" fill={theme.palette.error.light} />
            </BarChart>
          </ChartContainer>
        </Grid>
        <Grid xs={12} md={4}>
          <Paper variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Income</TableCell>
                    <TableCell>Expenses</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((datum) => (
                    <TableRow key={datum.bucket}>
                      <TableCell>{datum.bucket}</TableCell>
                      <TableCell>
                        <Typography
                          color={theme.palette.success.main}
                          variant="inherit"
                        >
                          {formatAmount(datum.income, currency)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          color={theme.palette.error.main}
                          variant="inherit"
                        >
                          {formatAmount(datum.expenses, currency)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </>
    ) : (
      <NoTransactionsFound />
    );

  return (
    <Grid container rowGap={2} columnSpacing={2} justifyContent="center">
      {content}
    </Grid>
  );
};

export default IncomeVsExpensesReport;
