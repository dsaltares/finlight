import type { NextPage } from 'next';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import WithAuthentication from '@components/WithAuthentication';
import Routes from '@lib/routes';

const Home: NextPage = () => {
  const { replace } = useRouter();
  useEffect(() => {
    void replace(Routes.transactions);
  }, [replace]);

  return <></>;
};

export default WithAuthentication(Home);
