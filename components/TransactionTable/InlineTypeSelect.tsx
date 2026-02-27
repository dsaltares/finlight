'use client';

import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TransactionType } from '@/server/trpc/procedures/schema';

type Props = {
  value: TransactionType;
  onValueChange: (value: TransactionType) => void;
};

export default function InlineTypeSelect({ value, onValueChange }: Props) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger size="sm" className="w-full px-1.5 gap-1">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Income">
          <ArrowUpRight className="size-3 text-green-500" />
          Income
        </SelectItem>
        <SelectItem value="Expense">
          <ArrowDownLeft className="size-3 text-red-500" />
          Expense
        </SelectItem>
        <SelectItem value="Transfer">
          <ArrowLeftRight className="size-3 text-blue-500" />
          Transfer
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
