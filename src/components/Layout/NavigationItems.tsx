import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import InsightsIcon from '@mui/icons-material/Insights';
import SavingsIcon from '@mui/icons-material/Savings';
import SettingsIcon from '@mui/icons-material/Settings';
import LabelIcon from '@mui/icons-material/Label';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import Link from 'next/link';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Routes from '@lib/routes';

const items = [
  {
    label: 'Transactions',
    href: Routes.transactions,
    icon: ReceiptLongIcon,
  },
  {
    label: 'Accounts',
    href: Routes.accounts,
    icon: AccountBalanceIcon,
  },
  {
    label: 'Categories',
    href: Routes.categories,
    icon: LabelIcon,
  },
  {
    label: 'Insights',
    href: Routes.insights,
    icon: InsightsIcon,
  },
  {
    label: 'Budget',
    href: Routes.budget,
    icon: SavingsIcon,
  },
  {
    label: 'Settings',
    href: Routes.settings,
    icon: SettingsIcon,
  },
];

const NavigationItems = () => (
  <List>
    {items.map((item) => (
      <ListItem key={item.href} disablePadding>
        <ListItemButton component={Link} href={item.href}>
          <ListItemIcon>
            <item.icon />
          </ListItemIcon>
          <ListItemText>{item.label}</ListItemText>
        </ListItemButton>
      </ListItem>
    ))}
  </List>
);

export default NavigationItems;
