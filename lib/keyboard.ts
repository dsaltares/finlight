export const isDialogOpen = () =>
  !!document.querySelector('[role="dialog"], [role="alertdialog"]');

type Shortcut = {
  key: string;
  description: string;
};

const commonShortcuts: Shortcut[] = [
  { key: '?', description: 'Keyboard shortcuts' },
];

const newTransaction: Shortcut = { key: 'N', description: 'New transaction' };
const newAccount: Shortcut = { key: 'N', description: 'New account' };
const newCategory: Shortcut = { key: 'N', description: 'New category' };
const newPreset: Shortcut = { key: 'N', description: 'New preset' };

const transactionShortcuts: Shortcut[] = [
  newTransaction,
  { key: 'F', description: 'Filters' },
  { key: 'E', description: 'Edit selected' },
  { key: 'Del', description: 'Delete selected' },
  { key: 'mod+A', description: 'Select all' },
  { key: 'Esc', description: 'Deselect all' },
];

const PageShortcuts: Record<string, Shortcut[]> = {
  '/dashboard/transactions': transactionShortcuts,
  '/dashboard/accounts': [newAccount],
  '/dashboard/categories': [newCategory],
  '/dashboard/import-presets': [newPreset],
};

export const getShortcutsForPath = (pathname: string) => {
  const match = Object.keys(PageShortcuts)
    .filter((route) => pathname.startsWith(route))
    .toSorted((a, b) => b.length - a.length)[0];
  const pageShortcuts = match ? PageShortcuts[match] : [];
  return [...pageShortcuts, ...commonShortcuts];
};

export const formatShortcutKey = (key: string) => {
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);
  return key
    .replace('mod+', isMac ? '\u2318' : 'Ctrl+')
    .replace('Del', isMac ? '\u232B' : 'Del');
};
