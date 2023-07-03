import Stack from '@mui/material/Stack';
import NavigationItems from './NavigationItems';

const SidebarContent = () => (
  <Stack justifyContent="space-between" height="100%" padding={1}>
    <NavigationItems />
  </Stack>
);

export default SidebarContent;
