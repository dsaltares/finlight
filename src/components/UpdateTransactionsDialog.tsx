import LoadingButton from '@mui/lab/LoadingButton';
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import useMediaQuery from '@mui/material/useMediaQuery';
import { type SubmitHandler, useForm, Controller } from 'react-hook-form';
import Stack from '@mui/material/Stack';
import { useCallback, useMemo, useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Autocomplete from '@mui/material/Autocomplete';
import Checkbox from '@mui/material/Checkbox';
import type { UpdateTransactionsInput } from '@server/transaction/types';
import type { Category } from '@server/category/types';
import { isOptionEqualToValue } from '@lib/autoCompleteOptions';

type Props = {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  categories: Category[];
  onUpdate: (input: Omit<UpdateTransactionsInput, 'ids'>) => Promise<unknown>;
};

const id = 'update-transactions-dialog';

type Option = { label: string; id: string };

type TransactionFormValues = {
  amount: string;
  date: Date | null;
  description: string;
  category: Option | null;
};

type FormFieldName = keyof Omit<UpdateTransactionsInput, 'ids'>;

const UpdateTransactionsDialog = ({
  open,
  loading,
  categories,
  onClose,
  onUpdate,
}: Props) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        label: category.name,
        id: category.id,
      })),
    [categories]
  );
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<TransactionFormValues>({
    mode: 'onBlur',
    defaultValues: {
      amount: '',
      date: null,
      description: '',
      category: null,
    },
  });
  const [enabledFields, setEnabledFields] = useState<
    Record<FormFieldName, boolean>
  >({} as Record<FormFieldName, boolean>);
  const onSubmit: SubmitHandler<TransactionFormValues> = useCallback(
    async (values) => {
      const processed = {
        ...values,
        date: new Date(values.date!),
        categoryId: values.category?.id || null,
        amount: parseFloat(values.amount),
      };
      const hasEnabledFields = Object.values(enabledFields).some(
        (field) => !!field
      );
      if (hasEnabledFields) {
        const data = Object.keys(enabledFields).reduce<
          Partial<typeof processed>
        >(
          (acc, field) =>
            enabledFields[field as FormFieldName]
              ? {
                  ...acc,
                  [field]: processed[field as FormFieldName],
                }
              : acc,
          {}
        );
        await onUpdate(data);
      }
      onClose();
    },
    [onUpdate, onClose, enabledFields]
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
      <DialogTitle id={`${id}-title`}>Edit transactions</DialogTitle>
      <DialogContent>
        <Stack
          paddingY={1}
          gap={1.5}
          component="form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Stack direction="row" gap={0.5} alignItems="center">
            <Checkbox
              checked={!!enabledFields['amount']}
              onChange={(e) =>
                setEnabledFields((enabled) => ({
                  ...enabled,
                  amount: e.target.checked,
                }))
              }
            />
            <TextField
              fullWidth
              type="number"
              label="Amount"
              error={!!errors.amount}
              inputProps={{
                step: 0.01,
              }}
              disabled={!enabledFields['amount']}
              {...register('amount')}
            />
          </Stack>
          <Stack direction="row" gap={0.5} alignItems="center">
            <Checkbox
              checked={!!enabledFields['date']}
              onChange={(e) =>
                setEnabledFields((enabled) => ({
                  ...enabled,
                  date: e.target.checked,
                }))
              }
            />
            <Controller
              control={control}
              name="date"
              render={({ field: { value, onChange } }) => (
                <DatePicker
                  label="Date"
                  value={value}
                  onChange={(value) => onChange(value)}
                  disabled={!enabledFields['date']}
                />
              )}
            />
          </Stack>
          <Stack direction="row" gap={0.5} alignItems="center">
            <Checkbox
              checked={!!enabledFields['description']}
              onChange={(e) =>
                setEnabledFields((enabled) => ({
                  ...enabled,
                  description: e.target.checked,
                }))
              }
            />
            <TextField
              fullWidth
              label="Description"
              error={!!errors.description}
              disabled={!enabledFields['description']}
              {...register('description')}
            />
          </Stack>
          <Stack direction="row" gap={0.5} alignItems="center">
            <Checkbox
              checked={!!enabledFields['categoryId']}
              onChange={(e) =>
                setEnabledFields((enabled) => ({
                  ...enabled,
                  categoryId: e.target.checked,
                }))
              }
            />
            <Controller
              control={control}
              name="category"
              render={({ field: { value, onChange, onBlur } }) => (
                <Autocomplete
                  fullWidth
                  id="category-autocomplete"
                  value={value}
                  onChange={(_event, newValue) => onChange(newValue!)}
                  options={categoryOptions}
                  isOptionEqualToValue={isOptionEqualToValue}
                  disabled={!enabledFields['categoryId']}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Category"
                      error={!!errors.category}
                    />
                  )}
                  onBlur={onBlur}
                />
              )}
            />
          </Stack>
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

export default UpdateTransactionsDialog;