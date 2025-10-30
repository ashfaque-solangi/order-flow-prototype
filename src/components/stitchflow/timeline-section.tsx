'use client';

import { useMemo } from 'react';
import { Unit } from '@/lib/data';
import { getDaysInMonth, startOfMonth, format, differenceInDays, parseISO } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

type TimelineSectionProps = {
  units: Unit[];
};

const ORDER_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
];

export default function TimelineSection({ units }: TimelineSectionProps) {
  const { days, monthStart } = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const numDays = getDaysInMonth(now);
    const days = Array.from({ length: numDays }, (_, i) => i + 1);
    return { days, monthStart };
  }, []);

  const allLines = useMemo(() => units.flatMap(unit => 
    unit.lines.map(line => ({ ...line, unitName: unit.name }))
  ), [units]);
  
  const orderColorMap = useMemo(() => {
    const orderIds = new Set(allLines.flatMap(line => line.assignments.map(a => a.orderId)));
    return Array.from(orderIds).reduce((acc, orderId, index) => {
      acc[orderId] = ORDER_COLORS[index % ORDER_COLORS.length];
      return acc;
    }, {} as Record<string, string>);
  }, [allLines]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <h2 className="text-lg font-semibold mb-2 flex items-center"><CalendarDays className="w-5 h-5 mr-2 text-primary" /> Production Line Timeline</h2>
      <ScrollArea className="flex-1 rounded-lg border bg-card">
        <div className="relative p-4">
          <div className="grid gap-y-2" style={{ gridTemplateColumns: `180px repeat(${days.length}, minmax(40px, 1fr))` }}>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-card font-semibold text-sm text-muted-foreground pl-2">Line / Unit</div>
            {days.map(day => (
              <div key={day} className="sticky top-0 z-10 bg-card text-center font-semibold text-sm">
                <span className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full mx-auto",
                  day === new Date().getDate() && "bg-primary text-primary-foreground"
                )}>{day}</span>
              </div>
            ))}

            {/* Body */}
            {allLines.map((line, lineIndex) => (
              <div key={line.id} className="contents group">
                <div className="text-sm border-t pt-2 pl-2">
                  <p className="font-semibold">{line.name}</p>
                  <p className="text-xs text-muted-foreground">{line.unitName}</p>
                </div>
                {/* Empty cells for grid layout */}
                {days.map(day => (
                  <div key={`${line.id}-${day}`} className="border-t"></div>
                ))}
                {/* Assignments */}
                {line.assignments.map((assignment, assignmentIndex) => {
                  try {
                    const startDate = parseISO(assignment.startDate);
                    const endDate = parseISO(assignment.endDate);
                    const startDay = differenceInDays(startDate, monthStart) + 1;
                    const duration = differenceInDays(endDate, startDate) + 1;
                    
                    if (startDay > 0 && startDay <= days.length) {
                       return (
                        <div
                          key={assignment.id}
                          className="h-10 row-start-[--row-start] self-center"
                          style={{
                            gridColumn: `${startDay + 1} / span ${duration}`,
                            '--row-start': lineIndex + 2,
                          } as React.CSSProperties}
                        >
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className={cn(
                                            "h-full w-full rounded-md text-white flex items-center px-2 text-xs font-medium cursor-pointer overflow-hidden",
                                            orderColorMap[assignment.orderId] || 'bg-gray-500'
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
                    return null;
                  } catch (e) {
                    console.error("Error parsing assignment date:", e, assignment);
                    return null;
                  }
                })}
              </div>
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
