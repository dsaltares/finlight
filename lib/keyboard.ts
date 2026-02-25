export const isDialogOpen = () =>
  !!document.querySelector('[role="dialog"], [role="alertdialog"]');

type Shortcut = {
  keys: string[];
  description: string;
  sequence?: boolean;
};

const navigationShortcuts: Shortcut[] = [
  { keys: ['g', 't'], description: 'Go to transactions', sequence: true },
  { keys: ['g', 'a'], description: 'Go to accounts', sequence: true },
  { keys: ['g', 'c'], description: 'Go to categories', sequence: true },
  { keys: ['g', 'b'], description: 'Go to budget', sequence: true },
  { keys: ['g', 'i'], description: 'Go to insights', sequence: true },
];

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
  { keys: ['/'], description: 'Focus search' },
  { keys: ['x'], description: 'Clear filters' },
];

const budgetShortcuts: Shortcut[] = [
  { keys: ['o'], description: 'Budget options' },
  { keys: ['\u2190'], description: 'Previous period' },
  { keys: ['\u2192'], description: 'Next period' },
  { keys: ['/'], description: 'Focus search' },
];

const PageShortcuts: Record<string, Shortcut[]> = {
  '/dashboard/transactions': transactionShortcuts,
  '/dashboard/accounts': [{ keys: ['n'], description: 'New account' }],
  '/dashboard/categories': [
    { keys: ['n'], description: 'New category' },
    { keys: ['/'], description: 'Focus search' },
  ],
  '/dashboard/import-presets': [{ keys: ['n'], description: 'New preset' }],
  '/dashboard/budget': budgetShortcuts,
};

export const getShortcutsForPath = (pathname: string) => {
  const match = Object.keys(PageShortcuts)
    .filter((route) => pathname.startsWith(route))
    .toSorted((a, b) => b.length - a.length)[0];
  const pageShortcuts = match ? PageShortcuts[match] : [];
  return [...pageShortcuts, ...navigationShortcuts, ...commonShortcuts];
};

export const formatKey = (key: string) => {
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);
  if (key === 'mod') return isMac ? '\u2318' : 'Ctrl';
  if (key === 'Del') return isMac ? '\u232B' : 'Del';
  return key;
};
