import client from '@lib/api';
import useFiltersFromurl from '@lib/useFiltersFromUrl';
import FullScreenSpinner from '@components/Layout/FullScreenSpinner';
import CategoryReport from './CategoryReport';
import NoTransactionsFound from './NoTransactionsFound';

const CategorizedExpensesReport = () => {
  const { filtersByField } = useFiltersFromurl();
  const { data, isLoading } = client.getCategoryReport.useQuery({
    type: 'Expense',
    from: filtersByField.date?.split(',')[0],
    until: filtersByField.date?.split(',')[1],
    accounts: filtersByField.accounts?.split(','),
    currency: filtersByField.currency,
  });

  if (isLoading) {
    return <FullScreenSpinner />;
  } else if (!data || data.length === 0) {
    return <NoTransactionsFound />;
  }

  return (
    <CategoryReport
      data={data || []}
      numberType="negative"
      currency={filtersByField.currency}
    />
  );
};

export default CategorizedExpensesReport;
