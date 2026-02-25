import { useHotkeys } from 'react-hotkeys-hook';
import { isDialogOpen } from '@/lib/keyboard';

export default function useImportPresetsKeyboardShortcuts(onCreateDialogOpen: () => void) {
  useHotkeys('n', () => {
    if (isDialogOpen()) return;
    onCreateDialogOpen();
  }, { preventDefault: true });
}
