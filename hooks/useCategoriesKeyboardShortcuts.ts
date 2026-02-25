import type { RefObject } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import useFocusSearch from '@/hooks/useFocusSearch';
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
  useFocusSearch(searchInputRef);
}
