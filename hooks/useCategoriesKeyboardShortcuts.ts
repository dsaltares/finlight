import type { RefObject } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { isDialogOpen } from '@/lib/keyboard';

type UseCategoriesKeyboardShortcutsArgs = {
  onCreateDialogOpen: () => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
};

export default function useCategoriesKeyboardShortcuts({
  onCreateDialogOpen,
  searchInputRef,
}: UseCategoriesKeyboardShortcutsArgs) {
  useHotkeys('n', () => {
    if (isDialogOpen()) return;
    onCreateDialogOpen();
  }, { preventDefault: true });
  useHotkeys('/', (e) => {
    if (e.metaKey || e.ctrlKey) return;
    if (isDialogOpen()) return;
    e.preventDefault();
    searchInputRef.current?.focus();
  });
}
