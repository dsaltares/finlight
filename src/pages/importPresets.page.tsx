import type { NextPage } from 'next';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import WithAuthentication from '@components/WithAuthentication';
import client from '@lib/api';
import useDialog from '@lib/useDialog';
import useCreateCSVImportPreset from '@lib/csvImportPresets/useCreateCSVImportPreset';
import CSVImportPresetList from '@components/CSVImportPresetList';
import CreateUpdateCSVImportPresetDialog from '@components/CreateUpdateCSVImportPresetDialog';

const ImportPresetsPage: NextPage = () => {
  const { data: presets } = client.getCSVImportPresets.useQuery();
  const {
    open: isCreateDialogOpen,
    onOpen: onCreateDialogOpen,
    onClose: onCreateDialogClose,
  } = useDialog();
  const { mutateAsync: createCSVImportPreset, isLoading: isCreating } =
    useCreateCSVImportPreset();

  return (
    <Stack gap={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h4" component="h1">
          Import Presets
        </Typography>
        <Stack direction="row" gap={1}>
          <Button
            color="primary"
            variant="contained"
            onClick={onCreateDialogOpen}
            startIcon={<AddIcon />}
          >
            New
          </Button>
        </Stack>
      </Stack>
      <CSVImportPresetList presets={presets || []} />
      <CreateUpdateCSVImportPresetDialog
        open={isCreateDialogOpen}
        loading={isCreating}
        onClose={onCreateDialogClose}
        onCreate={createCSVImportPreset}
      />
    </Stack>
  );
};

export default WithAuthentication(ImportPresetsPage);
