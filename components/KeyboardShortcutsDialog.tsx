'use client';

import { Keyboard } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import useDialog from '@/hooks/use-dialog';
import useNavigationKeyboardShortcuts from '@/hooks/useNavigationKeyboardShortcuts';
import { formatKey, getShortcutsForPath, isDialogOpen } from '@/lib/keyboard';

function ShortcutKeys({
  keys,
  sequence,
}: {
  keys: string[];
  sequence?: boolean;
}) {
  return (
    <span className="flex items-center gap-1">
      {keys.map((key, i) => (
        <span key={key} className="flex items-center gap-1">
          {i > 0 && (
            <span className="text-muted-foreground text-[11px]">
              {sequence ? 'then' : '+'}
            </span>
          )}
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
  const shortcuts = useMemo(() => getShortcutsForPath(pathname), [pathname]);

  useNavigationKeyboardShortcuts();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== '/' || !(e.metaKey || e.ctrlKey)) return;
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (isDialogOpen()) return;
      e.preventDefault();
      onOpen();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onOpen]);

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
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) onClose();
        }}
      >
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
                <ShortcutKeys
                  keys={shortcut.keys}
                  sequence={shortcut.sequence}
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
