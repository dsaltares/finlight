import type { PropsWithChildren } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Stack from '@mui/material/Stack';
import BlankLayout from './BlankLayout';
import SidebarLayout from './SidebarLayout';
import FullScreenSpinner from './FullScreenSpinner';

const BlankLayoutPaths = ['/auth', '/404'];

const Layout = ({ children }: PropsWithChildren) => {
  const { status } = useSession();
  const { pathname } = useRouter();

  const hasBlankLayout =
    status === 'unauthenticated' ||
    BlankLayoutPaths.some((path) => pathname.startsWith(path));
  let content: React.ReactElement | null = null;

  if (status === 'loading') {
    content = <FullScreenSpinner />;
  } else if (hasBlankLayout) {
    content = <BlankLayout>{children}</BlankLayout>;
  } else {
    content = <SidebarLayout>{children}</SidebarLayout>;
  }

  return (
    <Stack
      width="100%"
      sx={{
        '@supports (height: 100dvh)': {
          height: '100dvh',
        },
        '@supports not (height: 100dvh)': {
          height: '100vh',
        },
      }}
    >
      {content}
    </Stack>
  );
};

export default Layout;
