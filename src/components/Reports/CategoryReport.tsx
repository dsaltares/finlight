import Grid from '@mui/material/Unstable_Grid2';
import { Cell, Legend, Pie, PieChart } from 'recharts';
import stringToColor from 'string-to-color';
import Paper from '@mui/material/Paper';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import type { CategoryAggregate } from '@server/reports/types';
import { formatAmount } from '@lib/format';
import CategoryChip from '../CategoryChip';
import useIsMobile from '@lib/useIsMobile';
import ChartContainer from './ChartContainer';
import PieLabel from './PieLabel';
import NoTransactionsFound from './NoTransactionsFound';

type NumberType = 'positive' | 'negative' | 'neutral';

type Props = {
  data: CategoryAggregate[];
  numberType?: NumberType;
  currency?: string;
};

const CategoryReport = ({ data, numberType, currency = 'EUR' }: Props) => {
  const isMobile = useIsMobile();
  return (
    <Grid container rowGap={2} columnSpacing={2} justifyContent="center">
      {data.length > 0 ? (
        <>
          <Grid xs={12} md={8}>
            <ChartContainer>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  dataKey="value"
                  outerRadius="60%"
                  labelLine={!isMobile}
                  label={(props) => <PieLabel {...props} />}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={stringToColor(entry.name)}
                    />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ChartContainer>
          </Grid>
          <Grid xs={12} md={4}>
            <Paper variant="outlined">
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.map((datum) => (
                      <TableRow key={datum.id}>
                        <TableCell>
                          <CategoryChip id={datum.id} name={datum.name} />
                        </TableCell>
                        <TableCell>
                          <Typography
                            color={numberTypeToColor(numberType)}
                            variant="inherit"
                          >
                            {formatAmount(datum.value, currency)}
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
      )}
    </Grid>
  );
};

const numberTypeToColor = (numberType: NumberType = 'neutral') => {
  switch (numberType) {
    case 'positive':
      return 'success.main';
    case 'negative':
      return 'error';
    default:
      return 'inherit';
  }
};

export default CategoryReport;
