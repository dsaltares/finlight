export const isDialogOpen = () =>
  !!document.querySelector('[role="dialog"], [role="alertdialog"]');

type Shortcut = {
  keys: string[];
  description: string;
};

const commonShortcuts: Shortcut[] = [
  { keys: ['mod', '/'], description: 'Keyboard shortcuts' },
];

const transactionShortcuts: Shortcut[] = [
  { keys: ['n'], description: 'New transaction' },
  { keys: ['f'], description: 'Filters' },
  { keys: ['e'], description: 'Edit selected' },
  { keys: ['Del'], description: 'Delete selected' },
  { keys: ['mod', 'a'], description: 'Select all' },
  { keys: ['Esc'], description: 'Deselect all' },
];

const PageShortcuts: Record<string, Shortcut[]> = {
  '/dashboard/transactions': transactionShortcuts,
  '/dashboard/accounts': [{ keys: ['n'], description: 'New account' }],
  '/dashboard/categories': [{ keys: ['n'], description: 'New category' }],
  '/dashboard/import-presets': [{ keys: ['n'], description: 'New preset' }],
  '/dashboard/budget': [{ keys: ['o'], description: 'Budget options' }],
};

export const getShortcutsForPath = (pathname: string) => {
  const match = Object.keys(PageShortcuts)
    .filter((route) => pathname.startsWith(route))
    .toSorted((a, b) => b.length - a.length)[0];
  const pageShortcuts = match ? PageShortcuts[match] : [];
  return [...pageShortcuts, ...commonShortcuts];
};

export const formatKey = (key: string) => {
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);
  if (key === 'mod') return isMac ? '\u2318' : 'Ctrl';
  if (key === 'Del') return isMac ? '\u232B' : 'Del';
  return key;
};
