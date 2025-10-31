
'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

type TimelineCellProps = {
  lineId: string;
  date: Date;
};

export default function TimelineCell({ lineId, date }: TimelineCellProps) {
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
        "h-full w-full absolute inset-0 z-0",
        isOver && "outline outline-2 outline-primary -outline-offset-2 z-20 bg-primary/10"
      )}
    >
    </div>
  );
}

    