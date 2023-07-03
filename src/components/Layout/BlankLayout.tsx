import Stack from '@mui/material/Stack';
import type { PropsWithChildren } from 'react';

const BlankLayout = ({ children }: PropsWithChildren) => (
  <Stack
    component="main"
    alignItems="center"
    justifyContent="center"
    height="100%"
    width="100%"
  >
    {children}
  </Stack>
);

export default BlankLayout;
