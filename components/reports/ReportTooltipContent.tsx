'use client';

import type { Payload } from 'recharts/types/component/DefaultTooltipContent';

type TooltipFooter = {
  label: string;
  valueKey: string;
};

type Props = {
  active?: boolean;
  payload?: Payload<number, string>[];
  label?: string;
  formatValue: (value: number) => string;
  footer?: TooltipFooter;
  excludeFromItems?: string;
};

export default function ReportTooltipContent({
  active,
  payload,
  label,
  formatValue,
  footer,
  excludeFromItems,
}: Props) {
  if (!active || !payload?.length) return null;

  const items = payload.filter(
    (item) =>
      item.type !== 'none' &&
      (!excludeFromItems || item.name !== excludeFromItems),
  );

  return (
    <div className="border-border/50 bg-background grid min-w-32 items-start gap-1.5 border px-2.5 py-1.5 text-xs shadow-xl">
      {label && <div className="font-medium">{label}</div>}
      <div className="grid gap-1.5">
        {items.map((item) => (
          <div
            key={item.dataKey}
            className="flex w-full items-center gap-2"
          >
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{
                backgroundColor:
                  (item.payload as Record<string, unknown>)?.fill as string ||
                  item.color ||
                  undefined,
              }}
            />
            <div className="flex flex-1 items-center justify-between gap-4">
              <span className="text-muted-foreground">{item.name}</span>
              <span className="text-foreground font-mono font-medium tabular-nums">
                {formatValue(item.value as number)}
              </span>
            </div>
          </div>
        ))}
      </div>
      {footer && payload[0]?.payload && (
        <>
          <div className="border-border/50 border-t" />
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium">{footer.label}</span>
            <span className="text-foreground font-mono font-medium tabular-nums">
              {formatValue(
                (payload[0].payload as Record<string, number>)[
                  footer.valueKey
                ],
              )}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
