import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import Paper from '@mui/material/Paper';
import useDialogForId from '@lib/useDialogForId';
import type { CSVImportPreset } from '@server/csvImportPreset/types';
import useDeleteCSVImportPreset from '@lib/csvImportPresets/useDeleteCSVImportPreset';
import useUpdateCSVImportPreset from '@lib/csvImportPresets/useUpdateCSVImportPreset';
import ConfirmationDialog from './ConfirmationDialog';
import CSVImportPresetListItem from './CSVImportPresetListItem';
import CreateUpdateCSVImportPresetDialog from './CreateUpdateCSVImportPresetDialog';

type Props = {
  presets: CSVImportPreset[];
};

const CSVImportPresetList = ({ presets }: Props) => {
  const {
    openFor,
    open: deleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDialogForId('deletePreset');
  const { mutateAsync: deletePreset, isLoading: isDeleting } =
    useDeleteCSVImportPreset();
  const handleDelete = () =>
    openFor ? deletePreset({ id: openFor }) : undefined;

  const {
    openFor: presetId,
    open: isUpdateDialogOpen,
    onOpen: onUpdateDialogOpen,
    onClose: onUpdateDialogClose,
  } = useDialogForId('updatePreset');
  const preset = useMemo(
    () => presets.find((preset) => preset.id === presetId),
    [presets, presetId],
  );
  const { mutateAsync: updatePreset, isLoading: isUpdating } =
    useUpdateCSVImportPreset();

  return (
    <Paper>
      <List>
        {presets.map((preset) => (
          <CSVImportPresetListItem
            key={preset.id}
            preset={preset}
            onUpdate={onUpdateDialogOpen}
            onDelete={onDeleteOpen}
          />
        ))}

        <ConfirmationDialog
          id="delete-preset"
          title="Delete import preset"
          open={deleteOpen}
          loading={isDeleting}
          onClose={onDeleteClose}
          onConfirm={handleDelete}
        >
          <Typography variant="body1">
            Are you sure you want to delete this import preset? The action
            cannot be undone.
          </Typography>
        </ConfirmationDialog>

        {!!preset && (
          <CreateUpdateCSVImportPresetDialog
            preset={preset}
            open={isUpdateDialogOpen}
            loading={isUpdating}
            onClose={onUpdateDialogClose}
            onUpdate={updatePreset}
          />
        )}
      </List>
    </Paper>
  );
};

export default CSVImportPresetList;
