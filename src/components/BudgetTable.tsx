import { useMemo } from 'react';
import {
  type RowData,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TableSortLabel from '@mui/material/TableSortLabel';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import PaymentIcon from '@mui/icons-material/Payment';
import PaidIcon from '@mui/icons-material/Paid';
import type { BudgetEntry, BudgetEntryType } from '@server/budget/types';
import { formatAmount } from '@lib/format';
import useFiltersFromUrl from '@lib/useFiltersFromUrl';
import useSortFromUrl from '@lib/useSortFromUrl';
import CategoryChip from './CategoryChip';

type Props = {
  entries: BudgetEntry[];
  onUpdateEntry: (idx: number, entry: BudgetEntry) => void;
};

const columnHelper = createColumnHelper<BudgetEntry>();

declare module '@tanstack/table-core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    numeric: boolean;
  }
}

export const DefaultSort = { id: 'type', desc: true };

const BudgetTable = ({ entries, onUpdateEntry }: Props) => {
  const { sorting, toggleSort } = useSortFromUrl(DefaultSort);
  const { filtersByField } = useFiltersFromUrl();
  const currency = filtersByField.currency || 'EUR';
  const columns = useMemo(
    () => [
      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => (
          <Select
            defaultValue={info.getValue() || 'Expense'}
            renderValue={(selected) => {
              const icon =
                selected === 'Expense' ? <PaymentIcon /> : <PaidIcon />;
              return (
                <Stack direction="row" gap={1} alignItems="center">
                  {icon}
                  <Typography variant="body2" color="text.primary">
                    {selected}
                  </Typography>
                </Stack>
              );
            }}
            size="small"
            fullWidth
            onChange={(e) =>
              onUpdateEntry(info.row.index, {
                ...info.row.original,
                type: e.target.value as BudgetEntryType,
              })
            }
          >
            <MenuItem value="Expense">Expense</MenuItem>
            <MenuItem value="Income">Income</MenuItem>
          </Select>
        ),
      }),
      columnHelper.accessor('categoryName', {
        header: 'Category',
        cell: (info) => (
          <CategoryChip
            id={info.row.original.categoryId}
            name={info.getValue()}
          />
        ),
        enableGlobalFilter: true,
      }),
      columnHelper.accessor('target', {
        header: 'Target',
        cell: (info) => (
          <TextField
            defaultValue={info.getValue() || 0}
            type="number"
            inputProps={{
              step: 0.01,
              min: 0,
              style: { textAlign: 'right' },
            }}
            onChange={(e) =>
              onUpdateEntry(info.row.index, {
                ...info.row.original,
                target: parseFloat(e.target.value),
              })
            }
            size="small"
          />
        ),
        meta: { numeric: true },
      }),
      columnHelper.accessor('actual', {
        header: 'Actual',
        cell: (info) => {
          let color = 'success.main';
          if (
            info.row.original.type === 'Expense' &&
            info.getValue() > info.row.original.target
          ) {
            color = 'error.main';
          } else if (
            info.row.original.type === 'Income' &&
            info.getValue() < info.row.original.target
          ) {
            color = 'error.main';
          }
          return (
            <Typography color={color} fontSize="inherit">
              {formatAmount(info.getValue(), currency)}
            </Typography>
          );
        },
        meta: { numeric: true },
      }),
      columnHelper.display({
        id: 'difference',
        header: 'Difference',
        cell: (info) => {
          let color = 'success.main';
          if (
            info.row.original.type === 'Expense' &&
            info.row.original.actual > info.row.original.target
          ) {
            color = 'error.main';
          } else if (
            info.row.original.type === 'Income' &&
            info.row.original.actual < info.row.original.target
          ) {
            color = 'error.main';
          }
          return (
            <Typography color={color} fontSize="inherit">
              {formatAmount(
                Math.abs(info.row.original.actual - info.row.original.target),
                currency,
              )}
            </Typography>
          );
        },
        meta: { numeric: true },
      }),
    ],
    [currency, onUpdateEntry],
  );
  const table = useReactTable({
    data: entries,
    columns,
    state: {
      sorting,
      globalFilter: filtersByField.search,
    },
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const { targetTotal, actualTotal } = useMemo(
    () =>
      entries.reduce<{ targetTotal: number; actualTotal: number }>(
        (acc, entry) => {
          const multiplier = entry.type === 'Expense' ? -1 : 1;
          return {
            targetTotal: acc.targetTotal + entry.target * multiplier,
            actualTotal: acc.actualTotal + entry.actual * multiplier,
          };
        },
        { targetTotal: 0, actualTotal: 0 },
      ),
    [entries],
  );

  return (
    <Paper>
      <TableContainer>
        <Table size="small">
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    sortDirection={header.column.getIsSorted()}
                    align={
                      header.getContext().column.columnDef.meta?.numeric
                        ? 'right'
                        : 'left'
                    }
                  >
                    <TableSortLabel
                      active={!!header.column.getIsSorted()}
                      direction={header.column.getIsSorted() || undefined}
                      onClick={() => toggleSort(header.column.id)}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell />
              <TableCell>
                {' '}
                <Typography fontWeight="bold" fontSize="inherit">
                  Total
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography color="success.main" fontSize="inherit">
                  {formatAmount(targetTotal, currency)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography
                  color={
                    actualTotal > targetTotal ? 'success.main' : 'error.main'
                  }
                  fontSize="inherit"
                >
                  {formatAmount(actualTotal, currency)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography
                  color={
                    actualTotal > targetTotal ? 'success.main' : 'error.main'
                  }
                  fontSize="inherit"
                >
                  {formatAmount(actualTotal - targetTotal, currency)}
                </Typography>
              </TableCell>
            </TableRow>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    align={
                      cell.column.columnDef.meta?.numeric ? 'right' : 'left'
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default BudgetTable;