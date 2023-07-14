import client from '@lib/api';
import useFiltersFromurl from '@lib/useFiltersFromUrl';
import CategoryReport from './CategoryReport';

const CategorizedExpensesReport = () => {
  const { filtersByField } = useFiltersFromurl();
  const { data } = client.getCategoryReport.useQuery({
    type: 'Expense',
    from: filtersByField.date?.split(',')[0],
    until: filtersByField.date?.split(',')[1],
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
