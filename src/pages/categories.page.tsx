import type { NextPage } from 'next';
import AddIcon from '@mui/icons-material/Add';
import LabelIcon from '@mui/icons-material/Label';
import client from '@lib/api';
import WithAuthentication from '@components/WithAuthentication';
import useDialog from '@lib/useDialog';
import CategoryList from '@components/CategoryList';
import CreateUpdateCategoryDialog from '@components/CreateUpdateCategoryDialog';
import useCreateCategory from '@lib/categories/useCreateCategory';
import Fab from '@components/Fab';
import FullScreenSpinner from '@components/Layout/FullScreenSpinner';
import EmptyState from '@components/EmptyState';

const CategoriesPage: NextPage = () => {
  const { data: categories, isLoading } = client.getCategories.useQuery();
  const {
    open: isCreateDialogOpen,
    onOpen: onCreateDialogOpen,
    onClose: onCreateDialogClose,
  } = useDialog();
  const { mutateAsync: createCategory, isLoading: isCreating } =
    useCreateCategory();

  let content = null;
  if (isLoading) {
    content = <FullScreenSpinner />;
  } else if (!categories || categories.length === 0) {
    content = (
      <EmptyState
        Icon={LabelIcon}
      >{`You don't have any categories yet`}</EmptyState>
    );
  } else {
    content = <CategoryList categories={categories || []} />;
  }

  return (
    <>
      {content}
      {isCreateDialogOpen && (
        <CreateUpdateCategoryDialog
          open={isCreateDialogOpen}
          loading={isCreating}
          onClose={onCreateDialogClose}
          onCreate={createCategory}
        />
      )}
      <Fab aria-label="New category" onClick={onCreateDialogOpen}>
        <AddIcon />
      </Fab>
    </>
  );
};

export default WithAuthentication(CategoriesPage);
