'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

type CapacityBarProps = {
  total: number;
  used: number;
};

export default function CapacityBar({ total, used }: CapacityBarProps) {
  const percentage = useMemo(() => (total > 0 ? (used / total) * 100 : 0), [total, used]);

  const colorClass = useMemo(() => {
    if (percentage > 80) return 'bg-red-500';
    if (percentage > 60) return 'bg-yellow-500';
    return 'bg-green-500';
  }, [percentage]);
  
  // Custom styling for shadcn progress indicator.
  // We can't apply bg-color directly via className due to how shadcn's progress is styled.
  const progressStyle = {
    '--custom-progress-color': `var(--tw-${colorClass.replace('bg-', '')})`
  } as React.CSSProperties;


  return (
    <div>
        <Progress value={percentage} className="h-2 [&>div]:bg-primary" />
         <div className="text-xs text-right mt-1 font-medium text-muted-foreground">
            {Math.round(percentage)}% Utilized
        </div>
    </div>
  );
}