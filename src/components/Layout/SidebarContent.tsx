import Stack from '@mui/material/Stack';
import NavigationItems from './NavigationItems';
import UserMenu from './UserMenu';

const SidebarContent = () => (
  <Stack justifyContent="space-between" height="100%" paddingY={1}>
    <NavigationItems />
    <UserMenu />
  </Stack>
);

export default SidebarContent;
