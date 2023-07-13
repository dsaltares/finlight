import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import Link from 'next/link';
import { useRouter } from 'next/router';
import stringToColor from 'string-to-color';
import Routes from '@lib/routes';

type Props = {
  id?: string | null;
  name?: string | null;
};

const CategoryChip = ({ id, name }: Props) => {
  const theme = useTheme();
  const { query } = useRouter();
  return id && name ? (
    <Link
      href={{
        pathname: Routes.transactions,
        query: {
          ...query,
          filterByCategoryId: id,
        },
      }}
    >
      <Chip
        sx={{
          backgroundColor: stringToColor(name),
          color: theme.palette.getContrastText(stringToColor(name)),
        }}
        label={name}
        clickable
      />
    </Link>
  ) : (
    ''
  );
};

export default CategoryChip;
