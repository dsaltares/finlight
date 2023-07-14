import client from '@lib/api';
import useFiltersFromurl from '@lib/useFiltersFromUrl';
import CategoryReport from './CategoryReport';

const CategorizedIncomeReport = () => {
  const { filtersByField } = useFiltersFromurl();
  const { data } = client.getCategoryReport.useQuery({
    type: 'Income',
    from: filtersByField.date?.split(',')[0],
    until: filtersByField.date?.split(',')[1],
    accounts: filtersByField.accounts?.split(','),
    currency: filtersByField.currency,
  });
  return (
    <CategoryReport
      data={data || []}
      numberType="positive"
      currency={filtersByField.currency}
    />
  );
};

export default CategorizedIncomeReport;
