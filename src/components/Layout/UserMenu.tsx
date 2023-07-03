import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import LockIcon from '@mui/icons-material/Lock';
import GavelIcon from '@mui/icons-material/Gavel';
import CookieIcon from '@mui/icons-material/Cookie';
import LogoutIcon from '@mui/icons-material/Logout';
import Link from 'next/link';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Routes from '@lib/routes';
import useAvatar from '@lib/useAvatar';
import useMenu from '@lib/useMenu';

const buttonId = 'user-menu-button';
const menuId = 'user-menu';

const items = [
  {
    label: 'Privacy policy',
    icon: LockIcon,
    href: Routes.privacyPolicy,
  },
  {
    label: 'Terms of service',
    icon: GavelIcon,
    href: Routes.termsAndConditions,
  },
  {
    label: 'Cookie policy',
    icon: CookieIcon,
    href: Routes.cookiePolicy,
  },
  {
    label: 'Sign out',
    icon: LogoutIcon,
    href: Routes.signOut,
  },
];

const UserMenu = () => {
  const { anchorEl, open, onOpen, onClose } = useMenu();
  const { name, src, letter, color } = useAvatar();

  return (
    <>
      <Button
        id={buttonId}
        aria-controls={open ? menuId : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={onOpen}
        sx={{
          justifyContent: 'flex-start',
        }}
        color="inherit"
        variant="text"
      >
        <Stack direction="row" gap={1} alignItems="center">
          <Avatar sx={{ backgroundColor: color }} src={src}>
            {letter}
          </Avatar>
          {name}
        </Stack>
      </Button>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        open={open}
        onClose={onClose}
        MenuListProps={{
          'aria-labelledby': buttonId,
        }}
      >
        {items.map((item) => (
          <MenuItem key={item.href} component={Link} href={item.href}>
            <Stack component="li" direction="row" gap={0.5} alignItems="center">
              <ListItemIcon>
                <item.icon />
              </ListItemIcon>
              <ListItemText>{item.label}</ListItemText>
            </Stack>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default UserMenu;
