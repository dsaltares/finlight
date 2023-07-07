import { code } from 'currency-codes';
import flags from './flags';

export const currencyOptions = Object.keys(flags)
  .map((currency) => ({
    id: currency.toUpperCase(),
    label: code(currency.toUpperCase())?.currency as string,
  }))
  .filter((option) => !!option.label)
  .map(({ id, label }) => ({ id, label: `${id} - ${label}` }));

export type Option = { id: string; label: string };
export type OptionsById = Record<string, Option>;

export const currencyOptionsById = currencyOptions.reduce<OptionsById>(
  (acc, option) => ({
    ...acc,
    [option.id]: option,
  }),
  {}
);

export const isOptionEqualToValue = (option: Option, value: Option) =>
  option.id === value.id;

export const getOptionLabel = (option: Option) => option.label;
