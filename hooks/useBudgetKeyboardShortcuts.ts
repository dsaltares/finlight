import type { RefObject } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import useFocusSearch from '@/hooks/useFocusSearch';
import { isDialogOpen } from '@/lib/keyboard';

type UseBudgetKeyboardShortcutsArgs = {
  onSettingsOpen: () => void;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
};

export default function useBudgetKeyboardShortcuts({
  onSettingsOpen,
  onPreviousPeriod,
  onNextPeriod,
  searchInputRef,
}: UseBudgetKeyboardShortcutsArgs) {
  useHotkeys(
    'o',
    () => {
      if (isDialogOpen()) return;
      onSettingsOpen();
    },
    { preventDefault: true },
  );
  useHotkeys('left', () => {
    if (isDialogOpen()) return;
    onPreviousPeriod();
  });
  useHotkeys('right', () => {
    if (isDialogOpen()) return;
    onNextPeriod();
  });
  useFocusSearch(searchInputRef);
}
