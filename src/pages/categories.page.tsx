import type { NextPage } from 'next';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import client from '@lib/api';
import WithAuthentication from '@components/WithAuthentication';
import useDialog from '@lib/useDialog';
import CategoryList from '@components/CategoryList';
import CreateUpdateCategoryDialog from '@components/CreateUpdateCategoryDialog';
import useCreateCategory from '@lib/categories/useCreateCategory';

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
    <Stack gap={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h4" component="h1">
          Categories
        </Typography>
        <Stack direction="row" gap={1}>
          <Button
            color="primary"
            variant="contained"
            onClick={onCreateDialogOpen}
            startIcon={<AddIcon />}
          >
            New
          </Button>
        </Stack>
      </Stack>
      <CategoryList categories={categories || []} />
      <CreateUpdateCategoryDialog
        open={isCreateDialogOpen}
        loading={isCreating}
        onClose={onCreateDialogClose}
        onCreate={createCategory}
      />
    </Stack>
  );
};

export default WithAuthentication(CategoriesPage);
