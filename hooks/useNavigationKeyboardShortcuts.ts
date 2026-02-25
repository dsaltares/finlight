import { useRouter } from 'next/navigation';
import { useCallback, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { isDialogOpen } from '@/lib/keyboard';

export default function useNavigationKeyboardShortcuts() {
  const router = useRouter();
  const gPressedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useHotkeys('g', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (isDialogOpen()) return;
    gPressedRef.current = true;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      gPressedRef.current = false;
    }, 1000);
  });

  const navigate = useCallback(
    (e: KeyboardEvent, path: string) => {
      if (!gPressedRef.current) return;
      e.preventDefault();
      gPressedRef.current = false;
      clearTimeout(timeoutRef.current);
      router.push(path);
    },
    [router],
  );

  useHotkeys('t', (e) =>
    navigate(e, '/dashboard/transactions?period=lastMonth'),
  );
  useHotkeys('a', (e) => navigate(e, '/dashboard/accounts'));
  useHotkeys('c', (e) => navigate(e, '/dashboard/categories'));
  useHotkeys('b', (e) => navigate(e, '/dashboard/budget'));
  useHotkeys('i', (e) => navigate(e, '/dashboard/insights'));
}
