import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Link from 'next/link';
import stringToColor from 'string-to-color';
import Routes from '@lib/routes';
import type { Category } from '@server/category/types';

type Props = {
  category: Category;
  onUpdate: (id: string) => void;
  onDelete: (id: string) => void;
};

const CategoryListItem = ({ category, onUpdate, onDelete }: Props) => (
  <ListItem disableGutters>
    <ListItemButton
      component={Link}
      href={Routes.transactionsForCategory(category.id)}
    >
      <ListItemAvatar>
        <Avatar sx={{ backgroundColor: stringToColor(category.name) }}>
          {category.name[0]}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={category.name}
        secondary={
          category.importPatterns.length > 1
            ? `${category.importPatterns.length} import patterns`
            : category.importPatterns.length === 1
            ? '1 import pattern'
            : undefined
        }
      />
      <Stack direction="row" gap={1}>
        <IconButton
          onClick={(e) => {
            onUpdate(category.id);
            e.preventDefault();
          }}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          onClick={(e) => {
            onDelete(category.id);
            e.preventDefault();
          }}
        >
          <DeleteIcon />
        </IconButton>
      </Stack>
    </ListItemButton>
  </ListItem>
);

export default CategoryListItem;
