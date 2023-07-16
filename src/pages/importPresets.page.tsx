import type { NextPage } from 'next';
import AddIcon from '@mui/icons-material/Add';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import WithAuthentication from '@components/WithAuthentication';
import client from '@lib/api';
import useDialog from '@lib/useDialog';
import useCreateCSVImportPreset from '@lib/csvImportPresets/useCreateCSVImportPreset';
import CSVImportPresetList from '@components/CSVImportPresetList';
import CreateUpdateCSVImportPresetDialog from '@components/CreateUpdateCSVImportPresetDialog';
import Fab from '@components/Fab';
import FullScreenSpinner from '@components/Layout/FullScreenSpinner';
import EmptyState from '@components/EmptyState';

const ImportPresetsPage: NextPage = () => {
  const { data: presets, isLoading } = client.getCSVImportPresets.useQuery();
  const {
    open: isCreateDialogOpen,
    onOpen: onCreateDialogOpen,
    onClose: onCreateDialogClose,
  } = useDialog();
  const { mutateAsync: createCSVImportPreset, isLoading: isCreating } =
    useCreateCSVImportPreset();

  let content = null;
  if (isLoading) {
    content = <FullScreenSpinner />;
  } else if (!presets || presets.length === 0) {
    content = (
      <EmptyState
        Icon={FileUploadIcon}
      >{`You don't have any import presets yet.`}</EmptyState>
    );
  } else {
    content = <CSVImportPresetList presets={presets} />;
  }

  return (
    <>
      {content}
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
