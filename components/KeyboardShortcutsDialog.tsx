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
import { formatKey, getShortcutsForPath, isDialogOpen } from '@/lib/keyboard';

function ShortcutKeys({ keys }: { keys: string[] }) {
  return (
    <span className="flex items-center gap-1">
      {keys.map((key, i) => (
        <span key={key} className="flex items-center gap-1">
          {i > 0 && <span className="text-muted-foreground">+</span>}
          <kbd className="inline-flex h-6 min-w-6 items-center justify-center border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground">
            {formatKey(key)}
          </kbd>
        </span>
      ))}
    </span>
  );
}

export default function KeyboardShortcutsDialog() {
  const pathname = usePathname();
  const { open, onOpen, onClose } = useDialog();
  const shortcuts = useMemo(
    () => getShortcutsForPath(pathname),
    [pathname],
  );

  useHotkeys('mod+/', () => {
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
                key={shortcut.description}
                className="flex items-center justify-between"
              >
                <span className="text-muted-foreground">
                  {shortcut.description}
                </span>
                <ShortcutKeys keys={shortcut.keys} />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
