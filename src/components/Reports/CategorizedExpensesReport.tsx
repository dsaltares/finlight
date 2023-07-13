import client from '@lib/api';
import useFiltersFromurl from '@lib/useFiltersFromUrl';
import CategoryReport from './CategoryReport';

const CategorizedExpensesReport = () => {
  const { filtersByField } = useFiltersFromurl();
  const { data } = client.getCategoryReport.useQuery({
    type: 'Expense',
    accounts: filtersByField.accounts?.split(','),
    currency: filtersByField.currency,
  });
  return (
    <CategoryReport
      data={data || []}
      numberType="negative"
      currency={filtersByField.currency}
    />
  );
};

export default CategorizedExpensesReport;
