
'use client';

import { useMemo } from 'react';
import { ProductionLine, Assignment } from '@/lib/data';
import { differenceInDays, parseISO, isWithinInterval, areIntervalsOverlapping, startOfDay } from 'date-fns';
import TimelineCell from './timeline-cell';
import TimelineAssignment from './timeline-assignment';

type TimelineRowProps = {
  line: ProductionLine & { unitName: string };
  days: Date[];
  monthStart: Date;
  orderColorMap: Record<string, string>;
};

// Function to calculate layout of assignments into tracks to avoid overlaps
function getAssignmentLayout(assignments: Assignment[]): Assignment[][] {
    const sortedAssignments = [...assignments].sort((a, b) => 
        parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
    );

    const tracks: Assignment[][] = [];

    sortedAssignments.forEach(assignment => {
        let placed = false;
        const assignmentInterval = {
            start: startOfDay(parseISO(assignment.startDate)),
            end: startOfDay(parseISO(assignment.endDate))
        };
        
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            const hasOverlap = track.some(existing => 
                areIntervalsOverlapping(
                    assignmentInterval,
                    { start: startOfDay(parseISO(existing.startDate)), end: startOfDay(parseISO(existing.endDate)) },
                    { inclusive: true }
                )
            );

            if (!hasOverlap) {
                track.push(assignment);
                placed = true;
                break;
            }
        }

        if (!placed) {
            tracks.push([assignment]);
        }
    });

    return tracks;
}


export default function TimelineRow({ line, days, monthStart, orderColorMap }: TimelineRowProps) {
    
  const dailyUsage = useMemo(() => {
    const usage: Record<string, number> = {};
    days.forEach(day => {
        const dayKey = day.toISOString().split('T')[0];
        usage[dayKey] = 0;
        const currentDay = startOfDay(day);
        line.assignments.forEach(assignment => {
            const startDate = startOfDay(parseISO(assignment.startDate));
            const endDate = startOfDay(parseISO(assignment.endDate));
            if (isWithinInterval(currentDay, { start: startDate, end: endDate })) {
                const duration = differenceInDays(endDate, startDate) + 1;
                usage[dayKey] += assignment.quantity / duration;
            }
        });
    });
    return usage;
  }, [line.assignments, days]);

  const assignmentTracks = useMemo(() => getAssignmentLayout(line.assignments), [line.assignments]);
  const rowHeight = useMemo(() => Math.max(1, assignmentTracks.length) * 48, [assignmentTracks]); // 48px per track (h-12)


  return (
    <div className="contents group">
        {/* Row Header */}
        <div 
            className="text-sm p-2 sticky left-0 bg-card z-20 border-r border-b group-hover:bg-muted/50 flex flex-col justify-center"
            style={{ height: `${rowHeight}px` }}
        >
            <p className="font-semibold">{line.name}</p>
            <p className="text-xs text-muted-foreground">{line.unitName}</p>
        </div>

        {/* Daily Cells & Assignments Grid */}
        <div 
            className="col-start-2 col-end-[-1] grid relative border-b"
            style={{
                gridTemplateColumns: `repeat(${days.length}, minmax(48px, 1fr))`,
                gridTemplateRows: `repeat(${assignmentTracks.length || 1}, 48px)`,
            }}
        >
            {/* Daily Cells for droppable areas and capacity indicators */}
            {days.map((day, dayIndex) => {
                const dayKey = day.toISOString().split('T')[0];
                const totalAssignedQuantity = dailyUsage[dayKey] || 0;
                const utilization = line.dailyCap > 0 ? totalAssignedQuantity / line.dailyCap : 0;
                
                return (
                     <div key={day.toISOString()} className="relative border-r" style={{gridColumn: dayIndex + 1, gridRow: `1 / -1`}}>
                        <TimelineCell 
                            lineId={line.id}
                            date={day}
                            utilization={utilization}
                            assigned={Math.round(totalAssignedQuantity)}
                            capacity={line.dailyCap}
                        />
                    </div>
                );
            })}
        
            {/* Assignment Bars */}
            {assignmentTracks.map((track, trackIndex) => (
                track.map((assignment) => {
                    try {
                        const startDate = startOfDay(parseISO(assignment.startDate));
                        const endDate = startOfDay(parseISO(assignment.endDate));
                        
                        const startDayIndex = differenceInDays(startDate, monthStart);
                        const duration = differenceInDays(endDate, startDate) + 1;
                        
                        const monthDays = days.length;
                        
                        if (startDayIndex + duration <= 0 || startDayIndex >= monthDays) {
                            return null;
                        }

                        const clampedStart = Math.max(startDayIndex, 0);
                        const clampedEnd = Math.min(startDayIndex + duration, monthDays);
                        const clampedDuration = clampedEnd - clampedStart;

                        if (clampedDuration <= 0) {
                            return null;
                        }

                        return (
                            <div
                                key={assignment.id}
                                className="h-10 self-center z-10"
                                style={{
                                    gridColumn: `${clampedStart + 1} / span ${clampedDuration}`,
                                    gridRow: `${trackIndex + 1}`,
                                    padding: '4px 2px'
                                }}
                            >
                               <TimelineAssignment
                                    assignment={{...assignment, lineId: line.id}}
                                    color={orderColorMap[assignment.orderId] || 'bg-gray-500'}
                                />
                            </div>
                        );
                    } catch (e) {
                        console.error("Error parsing assignment date:", e, assignment);
                        return null;
                    }
                })
            ))}
        </div>
    </div>
  );
}
