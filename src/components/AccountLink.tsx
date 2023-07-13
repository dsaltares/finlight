import { useRouter } from 'next/router';
import Link from 'next/link';
import Routes from '@lib/routes';

type Props = {
  id: string;
  name: string;
};

const AccountLink = ({ id, name }: Props) => {
  const { query } = useRouter();
  return (
    <Link
      href={{
        pathname: Routes.transactions,
        query: {
          ...query,
          filterByAccountId: id,
        },
      }}
    >
      {name}
    </Link>
  );
};

export default AccountLink;
