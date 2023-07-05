import Box from '@mui/material/Box';
import { useState, type PropsWithChildren } from 'react';
import Stack from '@mui/material/Stack';
import Sidebar from './Sidebar';
import { DrawerWidth } from './constants';
import MobileHeader from './MobileHeader';

const SidebarLayout = ({ children }: PropsWithChildren) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);
  return (
    <Box sx={{ display: 'flex', flexGrow: 1, height: '100%' }}>
      <Sidebar mobileOpen={mobileOpen} onClose={handleDrawerToggle} />
      <Stack
        sx={{
          flexGrow: 1,
          width: `calc(100% - ${DrawerWidth}px)`,
        }}
      >
        <MobileHeader onOpenSidebar={handleDrawerToggle} />
        <Stack component="main" flexGrow={1} p={3}>
          {children}
        </Stack>
      </Stack>
    </Box>
  );
};

export default SidebarLayout;
