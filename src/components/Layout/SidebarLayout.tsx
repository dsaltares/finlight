import Box from '@mui/material/Box';
import {
  useState,
  type PropsWithChildren,
  useEffect,
  useCallback,
} from 'react';
import Stack from '@mui/material/Stack';
import { useRouter } from 'next/router';
import useIsMobile from '@lib/useIsMobile';
import Sidebar from './Sidebar';
import { DrawerWidth } from './constants';
import HeaderBar from './HeaderBar';

const SidebarLayout = ({ children }: PropsWithChildren) => {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);
  useRouteChange(useCallback(() => setMobileOpen(false), [setMobileOpen]));
  return (
    <Box sx={{ display: 'flex', flexGrow: 1, height: '100%' }}>
      <Sidebar mobileOpen={mobileOpen} onClose={handleDrawerToggle} />
      <Stack
        sx={{
          flexGrow: 1,
          width: `calc(100% - ${DrawerWidth}px)`,
        }}
      >
        <HeaderBar onOpenSidebar={handleDrawerToggle} />
        <Stack
          component="main"
          flexGrow={1}
          paddingY={isMobile ? 2 : 3}
          paddingX={isMobile ? 1 : 3}
          paddingBottom={10}
        >
          {children}
        </Stack>
      </Stack>
    </Box>
  );
};

export default SidebarLayout;

const useRouteChange = (onRouteChange: () => void) => {
  const router = useRouter();
  useEffect(() => {
    router.events.on('routeChangeStart', onRouteChange);
    return () => router.events.off('routeChangeStart', onRouteChange);
  }, [router, onRouteChange]);
};
