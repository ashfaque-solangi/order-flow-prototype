
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
  rowIndex: number;
};

export default function TimelineRow({ line, days, monthStart, orderColorMap, rowIndex }: TimelineRowProps) {
    
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
        {/* Row Header - STABLE */}
        <div className="text-sm pt-2 pl-2 sticky left-0 bg-card z-20 border-t border-b group-hover:bg-muted/50">
            <p className="font-semibold">{line.name}</p>
            <p className="text-xs text-muted-foreground">{line.unitName}</p>
        </div>

        {/* Daily Cells */}
        <div className="col-start-2 col-end-[-1] grid grid-cols-subgrid">
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
        </div>


        {/* Assignment Bars */}
        {line.assignments.map((assignment) => {
            try {
                const startDate = parseISO(assignment.startDate);
                const endDate = parseISO(assignment.endDate);
                
                const startDay = differenceInDays(startDate, monthStart);
                const duration = differenceInDays(endDate, startDate) + 1;
                
                const monthDays = days.length;
                
                if (startDay + duration < 0 || startDay >= monthDays) {
                    return null;
                }

                const clampedStart = Math.max(startDay, 0);
                const clampedEnd = Math.min(startDay + duration - 1, monthDays - 1);
                const clampedDuration = clampedEnd - clampedStart + 1;

                if (clampedDuration <= 0) {
                    return null;
                }

                return (
                    <div
                        key={assignment.id}
                        className="h-10 self-center z-10"
                        style={{
                            gridColumn: `${clampedStart + 2} / span ${clampedDuration}`,
                            gridRow: rowIndex
                        }}
                    >
                       <TimelineAssignment
                            assignment={assignment}
                            color={orderColorMap[assignment.orderId] || 'bg-gray-500'}
                        />
                    </div>
                );
            } catch (e) {
                console.error("Error parsing assignment date:", e, assignment);
                return null;
            }
        })}
    </div>
  );
}
