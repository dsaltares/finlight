const Routes = {
  home: '/',
  signIn: '/api/auth/signin',
  signOut: '/api/auth/signout',
  notFound: '/404',
  transactions: '/transactions',
  transactionsForCategory: (categoryId: string) =>
    `/transactions?categoryId=${categoryId}`,
  accounts: '/accounts',
  insights: '/insights',
  budget: '/budget',
  settings: '/settings',
  categories: '/categories',
  privacyPolicy: '/privacy_policy.pdf',
  termsAndConditions: '/terms_and_conditions.pdf',
  cookiePolicy: '/cookie_policy.pdf',
};

export default Routes;
