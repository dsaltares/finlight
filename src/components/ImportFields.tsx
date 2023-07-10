import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import {
  type CSVImportField,
  CSVImportFields,
} from '@server/csvImportPreset/types';

type Props = {
  fields: CSVImportField[];
  onAppend: (field: CSVImportField) => void;
  onRemove: (index: number) => void;
  onMove: (from: number, to: number) => void;
};

const ImportFields = ({ fields, onAppend, onRemove, onMove }: Props) => (
  <Stack gap={0.5}>
    <Select
      value={null}
      displayEmpty
      onChange={(event) => onAppend(event.target.value as CSVImportField)}
      renderValue={() => <em>Set field order</em>}
    >
      {CSVImportFields.map((field) => (
        <MenuItem key={field} value={field}>
          {field}
        </MenuItem>
      ))}
    </Select>
    <Paper elevation={0} variant="outlined">
      {fields.length > 0 ? (
        <List>
          {fields.map((field, index, allFields) => (
            <ListItem key={index}>
              <ListItemText>{field}</ListItemText>
              <Stack direction="row">
                {index > 0 && (
                  <IconButton>
                    <ArrowUpwardIcon onClick={() => onMove(index, index - 1)} />
                  </IconButton>
                )}
                {index < allFields.length - 1 && (
                  <IconButton>
                    <ArrowDownwardIcon
                      onClick={() => onMove(index, index + 1)}
                    />
                  </IconButton>
                )}
                <IconButton onClick={() => onRemove(index)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </ListItem>
          ))}
        </List>
      ) : (
        <Box padding={2}>
          <Typography variant="body2">No fields selected</Typography>
        </Box>
      )}
    </Paper>
  </Stack>
);

export default ImportFields;
