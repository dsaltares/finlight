import Fuse from 'fuse.js';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import type { Category } from '@server/category/types';
import useDialogForId from '@lib/useDialogForId';
import useDeleteCategory from '@lib/categories/useDeleteCategory';
import useUpdateCategory from '@lib/categories/useUpdateCategory';
import useFiltersFromUrl from '@lib/useFiltersFromUrl';
import ConfirmationDialog from './ConfirmationDialog';
import CreateUpdateCategoryDialog from './CreateUpdateCategoryDialog';
import CategoryListItem from './CategoryListItem';

type Props = {
  categories: Category[];
};

const CategoryList = ({ categories }: Props) => {
  const {
    openFor,
    open: deleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDialogForId('deleteCategory');
  const { mutateAsync: deleteCategory, isLoading: isDeleting } =
    useDeleteCategory();
  const handleDelete = () =>
    openFor ? deleteCategory({ id: openFor }) : undefined;

  const {
    openFor: categoryId,
    open: isUpdateDialogOpen,
    onOpen: onUpdateDialogOpen,
    onClose: onUpdateDialogClose,
  } = useDialogForId('updateCategory');
  const category = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId]
  );
  const { mutateAsync: updateCategory, isLoading: isUpdating } =
    useUpdateCategory();

  const { filtersByField, setFilters } = useFiltersFromUrl();
  const fuse = useMemo(
    () => new Fuse(categories, { keys: ['name'] }),
    [categories]
  );
  const filteredCategories = useMemo(
    () =>
      filtersByField.category
        ? fuse.search(filtersByField.category).map((result) => result.item)
        : categories,
    [categories, fuse, filtersByField.category]
  );

  return (
    <Stack gap={1}>
      <TextField
        placeholder="Search..."
        value={filtersByField.category || ''}
        onChange={(e) => setFilters({ category: e.target.value })}
        size="small"
      />
      <Paper>
        <List>
          {filteredCategories.map((category) => (
            <CategoryListItem
              key={category.id}
              category={category}
              onUpdate={onUpdateDialogOpen}
              onDelete={onDeleteOpen}
            />
          ))}
        </List>
      </Paper>
      <ConfirmationDialog
        id="delete-category"
        title="Delete category"
        open={deleteOpen}
        loading={isDeleting}
        onClose={onDeleteClose}
        onConfirm={handleDelete}
      >
        <Typography variant="body1">
          Are you sure you want to delete this category? The action cannot be
          undone and all the related transactions will be uncategorised.
        </Typography>
      </ConfirmationDialog>

      {!!category && (
        <CreateUpdateCategoryDialog
          category={category}
          open={isUpdateDialogOpen}
          loading={isUpdating}
          onClose={onUpdateDialogClose}
          onUpdate={updateCategory}
        />
      )}
    </Stack>
  );
};

export default CategoryList;
