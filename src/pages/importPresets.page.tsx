import type { NextPage } from 'next';
import AddIcon from '@mui/icons-material/Add';
import WithAuthentication from '@components/WithAuthentication';
import client from '@lib/api';
import useDialog from '@lib/useDialog';
import useCreateCSVImportPreset from '@lib/csvImportPresets/useCreateCSVImportPreset';
import CSVImportPresetList from '@components/CSVImportPresetList';
import CreateUpdateCSVImportPresetDialog from '@components/CreateUpdateCSVImportPresetDialog';
import Fab from '@components/Fab';

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
    <>
      <CSVImportPresetList presets={presets || []} />
      <CreateUpdateCSVImportPresetDialog
        open={isCreateDialogOpen}
        loading={isCreating}
        onClose={onCreateDialogClose}
        onCreate={createCSVImportPreset}
      />
      <Fab aria-label="New preset" onClick={onCreateDialogOpen}>
        <AddIcon />
      </Fab>
    </>
  );
};

export default WithAuthentication(ImportPresetsPage);
