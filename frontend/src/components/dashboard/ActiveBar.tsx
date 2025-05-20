'use client';

import { memo, useState } from 'react';
import { Bar } from 'recharts';

interface ActiveBarProps {
  dataKey: string;
  name: string;
  fill: string;
  activeColor?: string;
  radius?: number[];
  animationDuration?: number;
  animationBegin?: number;
}

const ActiveBar = memo(({
  dataKey,
  name,
  fill,
  activeColor,
  radius = [4, 4, 0, 0],
  animationDuration = 1000,
  animationBegin = 0
}: ActiveBarProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <Bar
      dataKey={dataKey}
      name={name}
      fill={fill}
      radius={radius}
      isAnimationActive={true}
      animationDuration={animationDuration}
      animationBegin={animationBegin}
      onMouseEnter={(data, index) => {
        setActiveIndex(index);
      }}
      onMouseLeave={() => {
        setActiveIndex(null);
      }}
    />
  );
});

ActiveBar.displayName = 'ActiveBar';

export default ActiveBar;
