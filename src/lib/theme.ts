import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily: ['Roboto Mono', 'monospace'].join(','),
  },
  palette: {
    primary: {
      main: '#263238',
    },
    secondary: {
      main: '#aeea00',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

export default theme;
