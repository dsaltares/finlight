import { useHotkeys } from 'react-hotkeys-hook';
import { isDialogOpen } from '@/lib/keyboard';

export default function useAccountsKeyboardShortcuts(onCreateDialogOpen: () => void) {
  useHotkeys('n', () => {
    if (isDialogOpen()) return;
    onCreateDialogOpen();
  }, { preventDefault: true });
}
