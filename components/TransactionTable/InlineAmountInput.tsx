'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  value: number;
  currency: string;
  onSave: (amountInCents: number) => void;
};

type CurrencyInfo = {
  symbol: string;
  isPrefix: boolean;
};

function getCurrencyInfo(currency: string): CurrencyInfo {
  try {
    const parts = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).formatToParts(1);
    const currencyPart = parts.find((p) => p.type === 'currency');
    const integerIdx = parts.findIndex((p) => p.type === 'integer');
    const currencyIdx = parts.findIndex((p) => p.type === 'currency');
    return {
      symbol: currencyPart?.value ?? currency,
      isPrefix: currencyIdx < integerIdx,
    };
  } catch {
    return { symbol: currency, isPrefix: true };
  }
}

function formatValue(cents: number) {
  if (cents === 0) return '0.00';
  return (cents / 100).toFixed(2);
}

export default function InlineAmountInput({ value, currency, onSave }: Props) {
  const [localValue, setLocalValue] = useState(() => formatValue(value));
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isDirtyRef = useRef(false);
  const info = useMemo(() => getCurrencyInfo(currency), [currency]);

  useEffect(() => {
    if (!isDirtyRef.current) {
      setLocalValue(formatValue(value));
    }
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (
        raw !== '' &&
        raw !== '-' &&
        raw !== '.' &&
        raw !== '-.' &&
        !/^-?\d*\.?\d*$/.test(raw)
      ) {
        return;
      }
      setLocalValue(raw);
      isDirtyRef.current = true;
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        const numeric =
          raw === '' || raw === '-' || raw === '.' ? 0 : Number(raw);
        onSave(Math.round(numeric * 100));
        isDirtyRef.current = false;
      }, 1000);
    },
    [onSave],
  );

  const handleBlur = useCallback(() => {
    const numeric =
      localValue === '' || localValue === '-' || localValue === '.'
        ? 0
        : Number(localValue);
    setLocalValue(numeric.toFixed(2));
  }, [localValue]);

  useEffect(() => {
    return () => clearTimeout(saveTimeoutRef.current);
  }, []);

  return (
    <div className="flex h-7 w-full items-center border border-input bg-transparent text-xs">
      {info.isPrefix && (
        <span className="shrink-0 pl-1.5 text-muted-foreground">
          {info.symbol}
        </span>
      )}
      <input
        type="text"
        inputMode="decimal"
        className="w-0 flex-1 bg-transparent px-1.5 text-right outline-none"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {!info.isPrefix && (
        <span className="shrink-0 pr-1.5 text-muted-foreground">
          {info.symbol}
        </span>
      )}
    </div>
  );
}
