import type { RefObject } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import useFocusSearch from '@/hooks/useFocusSearch';
import { isDialogOpen } from '@/lib/keyboard';

type UseTransactionsKeyboardShortcutsArgs = {
  onCreateDialogOpen: () => void;
  onFilterDialogOpen: () => void;
  onBulkEditDialogOpen: () => void;
  onBulkDeleteDialogOpen: () => void;
  selectedCount: number;
  handleSelectAll: () => void;
  handleDeselectAll: () => void;
  clearFilters: () => void;
  hasFilters: boolean;
  searchInputRef: RefObject<HTMLInputElement | null>;
};

export default function useTransactionsKeyboardShortcuts({
  onCreateDialogOpen,
  onFilterDialogOpen,
  onBulkEditDialogOpen,
  onBulkDeleteDialogOpen,
  selectedCount,
  handleSelectAll,
  handleDeselectAll,
  clearFilters,
  hasFilters,
  searchInputRef,
}: UseTransactionsKeyboardShortcutsArgs) {
  useHotkeys(
    'n',
    () => {
      if (isDialogOpen()) return;
      onCreateDialogOpen();
    },
    { preventDefault: true },
  );
  useHotkeys(
    'f',
    () => {
      if (isDialogOpen()) return;
      onFilterDialogOpen();
    },
    { preventDefault: true },
  );
  useHotkeys(
    'e',
    () => {
      if (isDialogOpen() || selectedCount === 0) return;
      onBulkEditDialogOpen();
    },
    { preventDefault: true },
  );
  useHotkeys('delete, backspace', () => {
    if (isDialogOpen() || selectedCount === 0) return;
    onBulkDeleteDialogOpen();
  });
  useHotkeys(
    'mod+a',
    () => {
      if (isDialogOpen()) return;
      handleSelectAll();
    },
    { preventDefault: true },
  );
  useHotkeys('escape', () => {
    if (isDialogOpen() || selectedCount === 0) return;
    handleDeselectAll();
  });
  useFocusSearch(searchInputRef);
  useHotkeys(
    'x',
    () => {
      if (isDialogOpen() || !hasFilters) return;
      clearFilters();
    },
    { preventDefault: true },
  );
}
