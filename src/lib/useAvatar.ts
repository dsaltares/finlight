import { useSession } from 'next-auth/react';

const stringToColor = (string: string) => {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
};

const letterAvatar = (name: string) => `${name.split(' ')[0][0]}`.toUpperCase();

const useAvatar = () => {
  const { data } = useSession();
  let name = data?.user?.name || '';
  if (!name && data?.user?.email) {
    name = data?.user?.email
      .split('@')[0]
      .split('.')
      .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
      .join(' ');
  }
  return {
    name,
    src: data?.user?.image || undefined,
    color: stringToColor(name),
    letter: letterAvatar(name),
  };
};

export default useAvatar;
