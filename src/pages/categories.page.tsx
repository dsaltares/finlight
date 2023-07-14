import type { NextPage } from 'next';
import AddIcon from '@mui/icons-material/Add';
import client from '@lib/api';
import WithAuthentication from '@components/WithAuthentication';
import useDialog from '@lib/useDialog';
import CategoryList from '@components/CategoryList';
import CreateUpdateCategoryDialog from '@components/CreateUpdateCategoryDialog';
import useCreateCategory from '@lib/categories/useCreateCategory';
import Fab from '@components/Fab';

const CategoriesPage: NextPage = () => {
  const { data: categories } = client.getCategories.useQuery();
  const {
    open: isCreateDialogOpen,
    onOpen: onCreateDialogOpen,
    onClose: onCreateDialogClose,
  } = useDialog();
  const { mutateAsync: createCategory, isLoading: isCreating } =
    useCreateCategory();

  return (
    <>
      <CategoryList categories={categories || []} />
      <CreateUpdateCategoryDialog
        open={isCreateDialogOpen}
        loading={isCreating}
        onClose={onCreateDialogClose}
        onCreate={createCategory}
      />
      <Fab aria-label="New category" onClick={onCreateDialogOpen}>
        <AddIcon />
      </Fab>
    </>
  );
};

export default WithAuthentication(CategoriesPage);
