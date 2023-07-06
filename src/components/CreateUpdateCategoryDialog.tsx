import LoadingButton from '@mui/lab/LoadingButton';
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import useMediaQuery from '@mui/material/useMediaQuery';
import { type SubmitHandler, useForm } from 'react-hook-form';
import Stack from '@mui/material/Stack';
import { useCallback } from 'react';
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@server/category/types';

type BaseProps = {
  open: boolean;
  loading: boolean;
  onClose: () => void;
};

type CreateProps = {
  onCreate: (input: CreateCategoryInput) => Promise<unknown>;
  category?: never;
  onUpdate?: never;
};

type EditProps = {
  category: Category;
  onUpdate: (input: UpdateCategoryInput) => Promise<unknown>;
  onCreate?: never;
};

type Props = BaseProps & (CreateProps | EditProps);

const id = 'create-update-category-dialog';

type CategoryFormValues = {
  name: string;
};

const CreateUpdateCategoryDialog = ({
  open,
  loading,
  category,
  onClose,
  onCreate,
  onUpdate,
}: Props) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CategoryFormValues>({
    mode: 'onBlur',
    defaultValues: { name: category?.name },
  });
  const onSubmit: SubmitHandler<CategoryFormValues> = useCallback(
    async (values) => {
      if (category) {
        await onUpdate({
          ...category,
          ...values,
        });
      } else {
        await onCreate(values);
      }
      onClose();
    },
    [onCreate, onUpdate, onClose, category]
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      id={id}
      aria-labelledby={`${id}-title`}
      fullScreen={fullScreen}
      keepMounted={false}
    >
      <DialogTitle id={`${id}-title`}>
        {category ? 'Edit category' : 'Create category'}
      </DialogTitle>
      <DialogContent>
        <Stack
          paddingY={1}
          gap={1.5}
          component="form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <TextField
            required
            label="Name"
            error={!!errors.name}
            {...register('name', { required: true })}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          color="primary"
          loading={loading}
          disabled={!isValid}
          onClick={handleSubmit(onSubmit)}
        >
          Save
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default CreateUpdateCategoryDialog;
