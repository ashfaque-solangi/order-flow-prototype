
'use client';

import { useMemo } from 'react';
import { ProductionLine, Assignment } from '@/lib/data';
import { differenceInDays, parseISO, isWithinInterval, startOfDay, eachDayOfInterval } from 'date-fns';
import TimelineCell from './timeline-cell';
import TimelineAssignment from './timeline-assignment';

type TimelineRowProps = {
  line: ProductionLine & { unitName: string };
  days: Date[];
  monthStart: Date;
  orderColorMap: Record<string, string>;
};

export default function TimelineRow({ line, days, monthStart, orderColorMap }: TimelineRowProps) {
    
  const dailyUsage = useMemo(() => {
    const usage: Record<string, number> = {};
    days.forEach(day => {
        const dayKey = day.toISOString().split('T')[0];
        usage[dayKey] = 0;
        line.assignments.forEach(assignment => {
            const startDate = startOfDay(parseISO(assignment.startDate));
            const endDate = startOfDay(parseISO(assignment.endDate));
            if (isWithinInterval(day, { start: startDate, end: endDate })) {
                const duration = differenceInDays(endDate, startDate) + 1;
                usage[dayKey] += assignment.quantity / duration;
            }
        });
    });
    return usage;
  }, [line.assignments, days]);


  return (
    <div className="contents group">
        {/* Row Header */}
        <div className="text-sm border-t pt-2 pl-2 sticky left-0 bg-card z-20">
            <p className="font-semibold">{line.name}</p>
            <p className="text-xs text-muted-foreground">{line.unitName}</p>
        </div>

        {/* Daily Cells */}
        {days.map((day, dayIndex) => {
            const dayKey = day.toISOString().split('T')[0];
            const totalAssignedQuantity = dailyUsage[dayKey] || 0;
            const utilization = line.dailyCap > 0 ? totalAssignedQuantity / line.dailyCap : 0;
            
            return (
                <TimelineCell 
                    key={`${line.id}-${day.toISOString()}`}
                    lineId={line.id}
                    date={day}
                    utilization={utilization}
                    assigned={Math.round(totalAssignedQuantity)}
                    capacity={line.dailyCap}
                />
            );
        })}

        {/* Assignment Bars */}
        {line.assignments.map((assignment) => {
            try {
                const startDate = parseISO(assignment.startDate);
                const endDate = parseISO(assignment.endDate);
                
                const startDay = differenceInDays(startDate, monthStart) + 1;
                const duration = differenceInDays(endDate, startDate) + 1;
                
                const clampedStartDay = Math.max(1, startDay);
                const endOfMonth = days.length;
                
                const clampedEndDay = Math.min(startDay + duration -1, endOfMonth);
                const clampedDuration = clampedEndDay - clampedStartDay + 1;

                if (clampedDuration > 0 && clampedStartDay <= endOfMonth) {
                    return (
                        <div
                            key={assignment.id}
                            className="h-10 self-center z-10"
                            style={{
                                gridColumn: `${clampedStartDay + 1} / span ${clampedDuration}`,
                                gridRow: 'auto',
                            }}
                        >
                           <TimelineAssignment
                                assignment={assignment}
                                color={orderColorMap[assignment.orderId] || 'bg-gray-500'}
                            />
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
  );
}
