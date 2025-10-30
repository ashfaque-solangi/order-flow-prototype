
'use client';

import { useMemo } from 'react';
import { ProductionLine, Assignment } from '@/lib/data';
import { differenceInDays, parseISO, isWithinInterval, startOfDay, eachDayOfInterval } from 'date-fns';
import TimelineCell from './timeline-cell';
import TimelineAssignment from './timeline-assignment';

const ORDER_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
];

type TimelineRowProps = {
  line: ProductionLine & { unitName: string };
  days: Date[];
  monthStart: Date;
};

export default function TimelineRow({ line, days, monthStart }: TimelineRowProps) {
    
  const orderColorMap = useMemo(() => {
    const orderIds = new Set(line.assignments.map(a => a.orderId));
    return Array.from(orderIds).reduce((acc, orderId, index) => {
      acc[orderId] = ORDER_COLORS[index % ORDER_COLORS.length];
      return acc;
    }, {} as Record<string, string>);
  }, [line.assignments]);

  const dailyAssignments = useMemo(() => {
    const assignmentsByDay: Record<string, Assignment[]> = {};
    eachDayOfInterval({ start: days[0], end: days[days.length - 1] }).forEach(day => {
        const dayKey = day.toISOString().split('T')[0];
        assignmentsByDay[dayKey] = [];
        line.assignments.forEach(assignment => {
            const startDate = startOfDay(parseISO(assignment.startDate));
            const endDate = startOfDay(parseISO(assignment.endDate));
            if (isWithinInterval(day, { start: startDate, end: endDate })) {
                assignmentsByDay[dayKey].push(assignment);
            }
        });
    });
    return assignmentsByDay;
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
            const assignedToday = dailyAssignments[dayKey] || [];
            const totalAssignedQuantity = assignedToday.reduce((sum, a) => sum + (a.quantity / (differenceInDays(parseISO(a.endDate), parseISO(a.startDate)) + 1)), 0);
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
