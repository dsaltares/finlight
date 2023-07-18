import Stack from '@mui/material/Stack';
import Logo from '@components/Logo';
import NavigationItems from './NavigationItems';
import UserMenu from './UserMenu';

const SidebarContent = () => (
  <Stack justifyContent="space-between" height="100%" paddingTop={4} paddingBottom={1}>
    <Stack gap={3}>
      <Stack alignItems="center">
    <Logo />
    </Stack>
    <NavigationItems />
    </Stack>
    <UserMenu />
  </Stack>
);

export default SidebarContent;
