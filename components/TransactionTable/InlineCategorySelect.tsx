'use client';

import { ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type Category = {
  id: number;
  name: string;
  color: string;
};

type Props = {
  value: number | null;
  categories: Category[];
  onValueChange: (categoryId: number | null) => void;
};

const UncategorizedValue = 'uncategorized';

export default function InlineCategorySelect({
  value,
  categories,
  onValueChange,
}: Props) {
  const [open, setOpen] = useState(false);

  const categoriesById = useMemo(() => {
    const map = new Map<number, Category>();
    for (const c of categories) {
      map.set(c.id, c);
    }
    return map;
  }, [categories]);

  const selected = value ? categoriesById.get(value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-7 w-full justify-between px-1.5 gap-1 text-xs"
        >
          <span className="flex flex-1 items-center gap-1.5 truncate">
            {selected ? (
              <>
                <span
                  className="size-2.5 shrink-0 rounded-full border border-border"
                  style={{ backgroundColor: selected.color }}
                />
                <span className="truncate">{selected.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Uncategorized</span>
            )}
          </span>
          <ChevronsUpDown className="size-3 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 w-48">
        <Command>
          <CommandInput placeholder="Search..." className="h-8 text-xs" />
          <CommandList className="max-h-52 overflow-y-auto overscroll-contain">
            <CommandEmpty>No categories found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={UncategorizedValue}
                keywords={['uncategorized', 'none']}
                data-checked={value === null || undefined}
                onSelect={() => {
                  onValueChange(null);
                  setOpen(false);
                }}
              >
                <span className="text-muted-foreground">Uncategorized</span>
              </CommandItem>
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={`${category.id}`}
                  keywords={[category.name]}
                  data-checked={value === category.id || undefined}
                  onSelect={(v) => {
                    onValueChange(Number(v));
                    setOpen(false);
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2.5 shrink-0 rounded-full border border-border"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="truncate">{category.name}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
