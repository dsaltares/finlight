import { useSession } from 'next-auth/react';
import stringToColor from 'string-to-color';

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
