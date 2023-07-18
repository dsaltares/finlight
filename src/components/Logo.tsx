import Link from 'next/link';
import Image from 'next/image';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Routes from '@lib/routes';

const Logo = () => (
  <Link href={Routes.home} style={{ textDecoration: 'none' }}>
    <Stack alignItems="center" gap={0.1}>
      <Image alt="logo" width={100} height={90} src="/logo-no-text.svg" />
      <Typography color="primary" fontWeight="bold" sx={{ fontSize: 24 }}>
        FINLIGHT
      </Typography>
    </Stack>
  </Link>
);

export default Logo;
