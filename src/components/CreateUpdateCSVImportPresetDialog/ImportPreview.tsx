import Stack from '@mui/material/Stack';
import {
  type ChangeEventHandler,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import type { UseFormWatch } from 'react-hook-form';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import { parse } from 'csv-parse/sync';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Paper from '@mui/material/Paper';
import type { CSVImportPresetFormValues } from './types';

type Props = {
  watch: UseFormWatch<CSVImportPresetFormValues>;
};

const ImportPreview = ({ watch }: Props) => {
  const [delimiter, fields, rowsToSkipStart, rowsToSkipEnd] = watch([
    'delimiter',
    'fields',
    'rowsToSkipStart',
    'rowsToSkipEnd',
  ]);
  const [csv, setCSV] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  const handleUploadClick = () => ref.current?.click();
  const handleFileUpload: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCSV(reader.result);
        }
      };
      if (file) {
        reader.readAsText(file);
      }
    },
    [setCSV]
  );
  const { headers, rows } = useMemo(() => {
    if (csv === '') {
      return {
        headers: [],
        rows: [],
      };
    }
    try {
      const records = parse(csv, {
        skip_empty_lines: false,
        delimiter: delimiter || ',',
      }) as string[][];
      const numCSVColumns = records[0].length || 0;
      const extraHeaders =
        fields.length < numCSVColumns
          ? (Array.from(Array(numCSVColumns - fields.length)).fill(
              'Unknown'
            ) as string[])
          : ([] as string[]);
      return {
        headers: ['#', ...fields.map((field) => field.value), ...extraHeaders],
        rows: records.slice(
          parseInt(rowsToSkipStart, 10),
          records.length - parseInt(rowsToSkipEnd, 10)
        ),
      };
    } catch (_e) {
      return {
        headers: [],
        rows: [],
      };
    }
  }, [csv, delimiter, fields, rowsToSkipStart, rowsToSkipEnd]);

  return (
    <Paper variant="outlined">
      <Stack gap={0.5} paddingX={2} paddingY={1}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="body1">Import preview</Typography>
          <Button startIcon={<FileUploadIcon />} onClick={handleUploadClick}>
            Choose file
            <input
              ref={ref}
              hidden
              type="file"
              accept="text/csv"
              onChange={handleFileUpload}
            />
          </Button>
        </Stack>
        <TableContainer>
          <Table sx={{ minWidth: 500 }} size="small">
            <TableHead>
              <TableRow>
                {headers.map((header, index) => (
                  <TableCell key={index}>{header}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  {row.map((cell, index) => (
                    <TableCell key={index}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Paper>
  );
};

export default ImportPreview;
