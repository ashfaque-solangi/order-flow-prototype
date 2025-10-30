
'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import DailyCapacityIndicator from './daily-capacity-indicator';

type TimelineCellProps = {
  lineId: string;
  date: Date;
  utilization: number;
  assigned: number;
  capacity: number;
};

export default function TimelineCell({ lineId, date, utilization, assigned, capacity }: TimelineCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `timeline-cell-${lineId}-${date.toISOString()}`,
    data: {
      type: 'timeline-cell',
      lineId: lineId,
      date: date,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-t h-12 relative",
        isOver && "outline outline-2 outline-primary -outline-offset-1 z-10"
      )}
    >
        <DailyCapacityIndicator utilization={utilization} assigned={assigned} capacity={capacity} />
    </div>
  );
}
