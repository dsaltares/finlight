import stringToColor from 'string-to-color';

const defaultFormat = (value: number | string) => `${value}`;

type Props = {
  x: number;
  y: number;
  cx: number;
  cy: number;
  value: number | string;
  name: string;
  percent: number;
  innerRadius: number;
  outerRadius: number;
  midAngle: number;
  formatValue?: (value: number | string) => string;
};

const PieLabel = ({
  x,
  y,
  cx,
  cy,
  value,
  name,
  percent,
  innerRadius,
  outerRadius,
  midAngle,
  formatValue = defaultFormat,
}: Props) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const innerX = cx + radius * Math.cos(-midAngle * RADIAN);
  const innerY = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <>
      <text
        x={innerX}
        y={innerY}
        fill="white"
        textAnchor={innerX > cx ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
      <text
        x={x}
        y={y}
        fill={stringToColor(name)}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {`${name}: ${formatValue(value)}`}
      </text>
    </>
  );
};

export default PieLabel;
