

'use client';

import { Assignment } from '@/lib/data';
import { useDraggable } from '@dnd-kit/core';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { parseISO, differenceInDays, startOfDay } from 'date-fns';


type TimelineAssignmentProps = {
  assignment: Assignment & { lineId: string };
  isDragging?: boolean;
};

const TentativeStripe = () => (
    <div
      className="absolute inset-0 opacity-20"
      style={{
        backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(0,0,0,0.3) 5px, rgba(0,0,0,0.3) 10px)`,
        backgroundSize: '150% 150%',
      }}
    />
);


export default function TimelineAssignment({ assignment, isDragging = false }: TimelineAssignmentProps) {
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
    
    const isTentative = !!assignment.tentative;
    const duration = differenceInDays(startOfDay(parseISO(assignment.endDate)), startOfDay(parseISO(assignment.startDate))) + 1;
    const showShortLabel = duration < 2;

    const color = isTentative ? 'bg-gray-400' : 'bg-primary';


  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn("h-full w-full", isGhost && "opacity-0")}>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "h-full w-full rounded-md text-white flex items-center px-2 text-xs font-medium overflow-hidden border border-black/20 relative",
                        "hover:ring-2 hover:ring-offset-2 hover:ring-primary",
                        dndIsDragging || isDragging ? "cursor-grabbing shadow-lg" : "cursor-grab",
                        color
                    )}>
                        {isTentative && <TentativeStripe />}

                        <p className="truncate relative z-10">
                            {showShortLabel ? assignment.order_num.split('-').pop() : assignment.order_num} ({assignment.quantity.toLocaleString()})
                        </p>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-bold">{assignment.order_num} {isTentative && <span className="text-amber-600 font-normal">(Tentative)</span>}</p>
                    <p>Quantity: {assignment.quantity.toLocaleString()}</p>
                    <p>Dates: {assignment.startDate} to {assignment.endDate}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    </div>
  );
}
