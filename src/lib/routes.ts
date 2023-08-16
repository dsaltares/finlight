const Routes = {
  home: '/',
  signIn: '/api/auth/signin',
  signOut: '/api/auth/signout',
  notFound: '/404',
  transactions: '/transactions',
  recentTransactions: '/transactions?filterByPeriod=lastMonth',
  transactionsForCategory: (categoryId: string) =>
    `/transactions?filterByCategoryId=${categoryId}&filterByPeriod=lastMonth`,
  transactionsForAccount: (accountId: string) =>
    `/transactions?filterByAccountId=${accountId}&filterByPeriod=lastMonth`,
  accounts: '/accounts',
  insights: '/insights?filterByPeriod=lastMonth',
  budget: '/budget',
  categories: '/categories',
  importPresets: '/importPresets',
  privacyPolicy: '/privacy_policy.pdf',
  termsAndConditions: '/terms_and_conditions.pdf',
  cookiePolicy: '/cookie_policy.pdf',
};

export default Routes;
