import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import MenuIcon from '@mui/icons-material/Menu';
import useIsMobile from '@lib/useIsMobile';

type Props = {
  onOpenSidebar: () => void;
};

const MobileHeader = ({ onOpenSidebar }: Props) => {
  const isMobile = useIsMobile();
  return isMobile ? (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onOpenSidebar}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Toolbar />
    </>
  ) : null;
};

export default MobileHeader;
