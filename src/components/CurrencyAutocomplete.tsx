import Autocomplete from '@mui/material/Autocomplete';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import type { FocusEventHandler } from 'react';
import flags from '@lib/flags';
import {
  currencyOptions,
  getOptionLabel,
  isOptionEqualToValue,
} from '@lib/autoCompleteOptions';

type Option = { label: string; id: string };

type Props = {
  value: Option;
  onChange: (value: Option) => void;
  error?: boolean;
  onBlur?: FocusEventHandler<HTMLDivElement>;
};

const CurrencyAutocomplete = ({ value, onChange, error, onBlur }: Props) => (
  <Autocomplete
    disableClearable
    id="currency-autocomplete"
    value={value}
    onChange={(_event, newValue) => onChange(newValue!)}
    options={currencyOptions}
    isOptionEqualToValue={isOptionEqualToValue}
    getOptionLabel={getOptionLabel}
    renderInput={(params) => (
      <TextField
        {...params}
        label="Currency"
        required
        error={error}
        InputProps={{
          ...params.InputProps,
          startAdornment: (
            <Avatar
              src={flags[value.id.toLowerCase()]}
              sx={{ width: 24, height: 24 }}
            >
              {value.label}
            </Avatar>
          ),
        }}
      />
    )}
    renderOption={(props, option) => (
      <li {...props}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Avatar
            src={flags[option.id.toLowerCase()]}
            sx={{ width: 24, height: 24 }}
          >
            {option.label}
          </Avatar>
          {option.label}
        </Stack>
      </li>
    )}
    onBlur={onBlur}
  />
);

export default CurrencyAutocomplete;
