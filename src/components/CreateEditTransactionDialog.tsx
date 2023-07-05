import LoadingButton from '@mui/lab/LoadingButton';
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import type {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from '@server/transaction/types';

type BaseProps = {
  open: boolean;
  loading: boolean;
  onClose: () => void;
};

type CreateProps = {
  onCreate: (input: CreateTransactionInput) => void;
  transaction?: never;
  onUpdate?: never;
};

type EditProps = {
  transaction: Transaction;
  onUpdate: (input: UpdateTransactionInput) => void;
  onCreate?: never;
};

type Props = BaseProps & (CreateProps | EditProps);

const id = 'create-update-transaction-dialog';

const CreateUpdateTransactionDialog = ({
  open,
  loading,
  onClose,
}: // onCreate,
// transaction,
// onUpdate,
Props) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  return (
    <Dialog
      open={open}
      onClose={onClose}
      id={id}
      aria-labelledby={`${id}-title`}
      fullScreen={fullScreen}
    >
      <DialogTitle id={`${id}-title`}>
        {"Use Google's location service?"}
      </DialogTitle>
      <DialogContent>Hello</DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <LoadingButton variant="contained" color="primary" loading={loading}>
          Submit
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default CreateUpdateTransactionDialog;
