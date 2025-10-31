
'use client';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

type DailyCapacityChartProps = {
    days: Date[];
    dailyUsage: Record<string, number>;
    dailyCap: number;
    lineId: string;
}

const getBackgroundColor = (util: number) => {
    if (util > 1) return 'bg-red-700';
    if (util > 0.9) return 'bg-red-500/80';
    if (util > 0.7) return 'bg-yellow-400/80';
    if (util > 0) return 'bg-green-500/80';
    return 'bg-transparent';
  };

export default function DailyCapacityChart({ days, dailyUsage, dailyCap, lineId }: DailyCapacityChartProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `timeline-chart-droppable-${lineId}`,
        data: {
          type: 'timeline-row',
          lineId: lineId,
        },
      });

    return (
        <div ref={setNodeRef} className="grid h-full" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(48px, 1fr))` }}>
            {days.map(day => {
                const dayKey = day.toISOString().split('T')[0];
                const totalAssignedQuantity = dailyUsage[dayKey] || 0;
                const utilization = dailyCap > 0 ? totalAssignedQuantity / dailyCap : 0;
                
                return (
                    <div key={day.toISOString()} className="relative border-r flex items-end justify-center px-px pb-px">
                       <div 
                         className={cn(
                            "w-full rounded-sm transition-all duration-300",
                            getBackgroundColor(utilization)
                         )}
                         style={{ height: `${Math.min(utilization, 1) * 80}%`, minHeight: utilization > 0 ? '2px' : '0' }}
                       ></div>
                    </div>
                )
            })}
        </div>
    );
}
