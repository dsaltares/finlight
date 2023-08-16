import client from '@lib/api';
import useFiltersFromUrl from '@lib/useFiltersFromUrl';
import FullScreenSpinner from '@components/Layout/FullScreenSpinner';
import getDateFilter from '@lib/getDateFilter';
import CategoryReport from './CategoryReport';
import NoTransactionsFound from './NoTransactionsFound';

const CategorizedIncomeReport = () => {
  const { filtersByField } = useFiltersFromUrl();
  const { data, isLoading } = client.getCategoryReport.useQuery({
    type: 'Income',
    date: getDateFilter(filtersByField),
    accounts: filtersByField.accounts?.split(','),
    currency: filtersByField.currency,
  });

  if (isLoading) {
    return <FullScreenSpinner />;
  } else if (!data || data.categories.length === 0) {
    return <NoTransactionsFound />;
  }

  return (
    <CategoryReport
      data={data}
      numberType="positive"
      currency={filtersByField.currency}
    />
  );
};

export default CategorizedIncomeReport;
