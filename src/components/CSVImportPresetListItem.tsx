import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import type { CSVImportPreset } from '@server/csvImportPreset/types';

type Props = {
  preset: CSVImportPreset;
  onUpdate: (id: string) => void;
  onDelete: (id: string) => void;
};

const CSVImportPresetListItem = ({ preset, onUpdate, onDelete }: Props) => (
  <ListItem>
    <ListItemAvatar>
      <Avatar>
        <FileUploadIcon />
      </Avatar>
    </ListItemAvatar>
    <ListItemText primary={preset.name} />
    <Stack direction="row" gap={1}>
      <IconButton onClick={() => onUpdate(preset.id)}>
        <EditIcon />
      </IconButton>
      <IconButton onClick={() => onDelete(preset.id)}>
        <DeleteIcon />
      </IconButton>
    </Stack>
  </ListItem>
);

export default CSVImportPresetListItem;
