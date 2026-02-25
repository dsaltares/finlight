import type { RefObject } from 'react';
import { useEffect } from 'react';
import { isDialogOpen } from '@/lib/keyboard';

export default function useFocusSearch(
  ref: RefObject<HTMLInputElement | null>,
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== '/') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (isDialogOpen()) return;
      e.preventDefault();
      ref.current?.focus();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [ref]);
}
