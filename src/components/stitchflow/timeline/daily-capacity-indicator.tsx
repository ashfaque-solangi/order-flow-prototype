
'use client';

import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type DailyCapacityIndicatorProps = {
  utilization: number;
  assigned: number;
  capacity: number;
};

export default function DailyCapacityIndicator({ utilization, assigned, capacity }: DailyCapacityIndicatorProps) {
  const getBackgroundColor = (util: number) => {
    if (util > 0.9) return 'bg-red-200/50';
    if (util > 0.7) return 'bg-yellow-200/50';
    if (util > 0) return 'bg-green-200/50';
    return 'bg-transparent';
  };

  const colorClass = getBackgroundColor(utilization);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("absolute inset-0 z-0", colorClass)}></div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Capacity: {capacity.toLocaleString()}</p>
          <p>Assigned: {assigned.toLocaleString()}</p>
          <p>Utilization: {Math.round(utilization * 100)}%</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
