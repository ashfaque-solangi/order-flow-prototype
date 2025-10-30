
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
    if (util > 1) return 'bg-red-500/80';
    if (util > 0.9) return 'bg-red-500/60';
    if (util > 0.7) return 'bg-yellow-400/60';
    if (util > 0) return 'bg-green-400/50';
    return 'bg-transparent';
  };

  const colorClass = getBackgroundColor(utilization);
  const cappedUtilization = Math.min(utilization, 1);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div 
              className={cn("absolute bottom-0 left-0 right-0 transition-all duration-300", colorClass)}
              style={{ height: `${cappedUtilization * 100}%` }}
            ></div>
          </div>
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
