import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import type { Category } from '@server/category/types';
import useDialogForId from '@lib/useDialogForId';
import useDeleteCategory from '@lib/categories/useDeleteCategory';
import useDialogFromUrl from '@lib/useDialogFromUrl';
import useUpdateCategory from '@lib/categories/useUpdateCategory';
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
  } = useDialogForId();
  const { mutateAsync: deleteCategory, isLoading: isDeleting } =
    useDeleteCategory();
  const handleDelete = () =>
    openFor ? deleteCategory({ id: openFor }) : undefined;

  const {
    openFor: categoryId,
    open: isUpdateDialogOpen,
    onOpen: onUpdateDialogOpen,
    onClose: onUpdateDialogClose,
  } = useDialogFromUrl('categoryId');
  const category = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId]
  );
  const { mutateAsync: updateCategory, isLoading: isUpdating } =
    useUpdateCategory();

  return (
    <List>
      {categories.map((category) => (
        <CategoryListItem
          key={category.id}
          category={category}
          onUpdate={onUpdateDialogOpen}
          onDelete={onDeleteOpen}
        />
      ))}

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
    </List>
  );
};

export default CategoryList;
