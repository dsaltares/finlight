'use client';

import { useCallback, useRef, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Props = {
  value: string;
  onCopy: (text: string) => void;
};

export default function DescriptionCell({ value, onCopy }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const handleMouseEnter = useCallback(() => {
    const el = ref.current;
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, []);

  const trigger = (
    <button
      ref={ref}
      type="button"
      className="block max-w-[200px] cursor-pointer truncate"
      onMouseEnter={handleMouseEnter}
      onClick={() => onCopy(value)}
    >
      {value}
    </button>
  );

  if (!isTruncated) return trigger;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent>{value}</TooltipContent>
    </Tooltip>
  );
}
