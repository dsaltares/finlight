import PaymentIcon from '@mui/icons-material/Payment';
import PaidIcon from '@mui/icons-material/Paid';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Chip from '@mui/material/Chip';
import type { TransactionType } from '@server/transaction/types';

type Props = {
  type: TransactionType;
};

const TransactionTypeChip = ({ type }: Props) => {
  const { query } = useRouter();
  const icon =
    type === 'Expense' ? (
      <PaymentIcon />
    ) : type === 'Income' ? (
      <PaidIcon />
    ) : (
      <SwapHorizIcon />
    );
  return (
    <Link
      href={{
        query: {
          ...query,
          filterByType: type,
        },
      }}
    >
      <Chip icon={icon} label={type} variant="outlined" clickable />
    </Link>
  );
};

export default TransactionTypeChip;
