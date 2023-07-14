import createAccount from './account/createAccount';
import deleteAccount from './account/deleteAccount';
import getAccounts from './account/getAccounts';
import updateAccount from './account/updateAccount';
import createCategory from './category/createCategory';
import deleteCategory from './category/deleteCategory';
import getCategories from './category/getCategories';
import updateCategory from './category/updateCategory';
import createCSVImportPreset from './csvImportPreset/createCSVImportPreset';
import deleteCSVImportPreset from './csvImportPreset/deleteCSVImportPreset';
import getCSVImportPresets from './csvImportPreset/getCSVImportPresets';
import updateCSVImportPreset from './csvImportPreset/updateCSVImportPreset';
import getCategoryReport from './reports/getCategoryReport';
import getIncomeVsExpensesReport from './reports/getIncomeVsExpensesReport';
import createTransaction from './transaction/createTransaction';
import createTransactions from './transaction/createTransactions';
import deleteTransactions from './transaction/deleteTransactions';
import getTransactions from './transaction/getTransactions';
import updateTransaction from './transaction/updateTransaction';
import updateTransactions from './transaction/updateTransactions';
import trpc from './trpc';

const router = trpc.router({
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getTransactions,
  createTransaction,
  createTransactions,
  updateTransaction,
  updateTransactions,
  deleteTransactions,
  getCSVImportPresets,
  createCSVImportPreset,
  updateCSVImportPreset,
  deleteCSVImportPreset,
  getCategoryReport,
  getIncomeVsExpensesReport,
});

export default router;

export type AppRouter = typeof router;
