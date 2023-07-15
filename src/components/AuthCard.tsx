import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import type { PropsWithChildren } from 'react';

type Props = {
  title: string;
  icon?: React.ReactNode;
};

const AuthCard = ({ title, icon, children }: PropsWithChildren<Props>) => {
  const theme = useTheme();
  return (
    <Stack
      width="100%"
      height="100%"
      alignItems="center"
      justifyContent="center"
      sx={{ backgroundColor: theme.palette.grey[100] }}
    >
      <Paper variant="outlined" sx={{ maxWidth: 640, width: '100%' }}>
        <Stack padding={4} gap={6} width="100%" alignItems="center">
          <Stack direction="row" gap={2} alignItems="center">
            {!!icon && icon}
            <Typography variant="h5" component="h1">
              {title}
            </Typography>
          </Stack>
          {children}
        </Stack>
      </Paper>
    </Stack>
  );
};

export default AuthCard;
