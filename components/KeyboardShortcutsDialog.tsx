'use client';

import { Keyboard } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import useDialog from '@/hooks/use-dialog';
import {
  formatShortcutKey,
  getShortcutsForPath,
  isDialogOpen,
} from '@/lib/keyboard';

export default function KeyboardShortcutsDialog() {
  const pathname = usePathname();
  const { open, onOpen, onClose } = useDialog();
  const shortcuts = useMemo(
    () => getShortcutsForPath(pathname),
    [pathname],
  );

  useHotkeys('shift+/', () => {
    if (isDialogOpen()) return;
    onOpen();
  }, { preventDefault: true });

  if (shortcuts.length <= 1) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Keyboard shortcuts"
        onClick={onOpen}
      >
        <Keyboard className="h-5 w-5" />
      </Button>
      <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between"
              >
                <span className="text-muted-foreground">
                  {shortcut.description}
                </span>
                <kbd className="inline-flex h-6 min-w-6 items-center justify-center border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground">
                  {formatShortcutKey(shortcut.key)}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
