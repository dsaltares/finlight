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
import Typography from '@mui/material/Typography';
import { signOut } from 'next-auth/react';
import Routes from '@lib/routes';
import useAvatar from '@lib/useAvatar';
import useMenu from '@lib/useMenu';
import useDialog from '@lib/useDialog';
import ConfirmationDialog from '@components/ConfirmationDialog';

const buttonId = 'user-menu-button';
const menuId = 'user-menu';

const UserMenu = () => {
  const { anchorEl, open, onOpen, onClose } = useMenu();
  const { name, src, letter, color } = useAvatar();
  const {
    open: isSignOutDialogOpen,
    onOpen: onSignOutDialogOpen,
    onClose: onSignOutDialogClose,
  } = useDialog();
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
      onClick: onSignOutDialogOpen,
    },
  ];

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
          <Typography variant="body1">{name}</Typography>
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
        {items.map((item) => {
          const content = (
            <Stack component="li" direction="row" gap={0.5} alignItems="center">
              <ListItemIcon>
                <item.icon />
              </ListItemIcon>
              <ListItemText>{item.label}</ListItemText>
            </Stack>
          );
          return item.href ? (
            <MenuItem key={item.href} component={Link} href={item.href}>
              {content}
            </MenuItem>
          ) : (
            <MenuItem key={item.label} onClick={item.onClick}>
              {content}
            </MenuItem>
          );
        })}
      </Menu>
      <ConfirmationDialog
        id="sign-out-dialog"
        title="Sign out"
        open={isSignOutDialogOpen}
        onClose={onSignOutDialogClose}
        onConfirm={signOut}
        loading={false}
      >
        <Typography variant="body1">
          Are you sure you want to sign out?
        </Typography>
      </ConfirmationDialog>
    </>
  );
};

export default UserMenu;
