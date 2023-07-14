import BaseFab from '@mui/material/Fab';
import { useTheme } from '@mui/material/styles';

type Props = Parameters<typeof BaseFab>[0];

const Fab = (props: Props) => {
  const theme = useTheme();
  return (
    <BaseFab
      color="primary"
      {...props}
      sx={{
        position: 'fixed',
        bottom: theme.spacing(3),
        right: theme.spacing(3),
      }}
    />
  );
};

export default Fab;
