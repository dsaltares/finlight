/* eslint-disable @typescript-eslint/no-explicit-any */
import Stack from '@mui/material/Stack';
import {
  type PropsWithChildren,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { ResponsiveContainer } from 'recharts';

type Props = {
  height?: number;
};

const ChartContainer = ({
  children,
  height: minHeight = 300,
}: PropsWithChildren<Props>) => {
  const ref = useRef<HTMLDivElement>(null);

  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);

  useLayoutEffect(() => {
    const updateSize = () => {
      setWidth(ref.current?.offsetWidth || 0);
      setHeight(ref.current?.offsetHeight || 0);
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <Stack ref={ref} width="100%" height="100%" minHeight={minHeight}>
      <Stack width={width} height={height}>
        <ResponsiveContainer width="100%" height="100%">
          {children as any}
        </ResponsiveContainer>
      </Stack>
    </Stack>
  );
};

export default ChartContainer;
