
'use client';

import { Progress } from '@/components/ui/progress';
import { useMemo } from 'react';

type CapacityBarProps = {
  total: number;
  used: number;
};

export default function CapacityBar({ total, used }: CapacityBarProps) {
  const percentage = useMemo(() => (total > 0 ? (used / total) * 100 : 0), [total, used]);

  const colorClass = useMemo(() => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  }, [percentage]);

  return (
    <div>
      <Progress value={percentage} className="h-2" indicatorClassName={colorClass} />
      <div className="text-xs text-right mt-1 font-medium text-muted-foreground">
        {Math.round(percentage)}% Utilized ({used.toLocaleString()} / {total.toLocaleString()})
      </div>
    </div>
  );
}

    