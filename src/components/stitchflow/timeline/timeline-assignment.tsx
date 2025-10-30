
'use client';

import { Assignment, ProductionLine } from '@/lib/data';
import { useDraggable } from '@dnd-kit/core';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type TimelineAssignmentProps = {
  assignment: Assignment;
  lineId: string;
  color: string;
  isDragging?: boolean;
};

export default function TimelineAssignment({ assignment, lineId, color, isDragging = false }: TimelineAssignmentProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging: dndIsDragging } = useDraggable({
        id: `assignment-${assignment.id}`,
        data: {
            type: 'assignment',
            assignment: assignment,
            lineId: lineId,
        },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
    } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "h-full w-full rounded-md text-white flex items-center px-2 text-xs font-medium overflow-hidden",
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
