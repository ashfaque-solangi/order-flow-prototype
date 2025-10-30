
'use client';

import { Assignment } from '@/lib/data';
import { useDraggable } from '@dnd-kit/core';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

type TimelineAssignmentProps = {
  assignment: Assignment & { lineId: string };
  color: string;
  isDragging?: boolean;
};

export default function TimelineAssignment({ assignment, color, isDragging = false }: TimelineAssignmentProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging: dndIsDragging, active } = useDraggable({
        id: `assignment-${assignment.id}`,
        data: {
            type: 'assignment',
            assignment: assignment,
            lineId: assignment.lineId,
        },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        position: 'relative',
        zIndex: 1000,
    } : undefined;

    const isGhost = !!active && active.id === `assignment-${assignment.id}` && !isDragging;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn("h-full w-full", isGhost && "opacity-50")}>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "h-full w-full rounded-md text-white flex items-center px-2 text-xs font-medium overflow-hidden border border-black/20",
                        "hover:ring-2 hover:ring-offset-2 hover:ring-primary",
                        dndIsDragging || isDragging ? "cursor-grabbing shadow-lg" : "cursor-grab",
                        color
                    )}>
                        <p className="truncate">{assignment.order_num}</p>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-bold">{assignment.order_num}</p>
                    <p>Quantity: {assignment.quantity.toLocaleString()}</p>
                    <p>Dates: {assignment.startDate} to {assignment.endDate}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    </div>
  );
}
