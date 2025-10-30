
'use client';

import { useMemo } from 'react';
import { ProductionLine, Assignment } from '@/lib/data';
import { differenceInDays, parseISO, isWithinInterval, areIntervalsOverlapping } from 'date-fns';
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
            start: parseISO(assignment.startDate),
            end: parseISO(assignment.endDate)
        };
        
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            const hasOverlap = track.some(existing => 
                areIntervalsOverlapping(
                    assignmentInterval,
                    { start: parseISO(existing.startDate), end: parseISO(existing.endDate) },
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
        line.assignments.forEach(assignment => {
            const startDate = parseISO(assignment.startDate);
            const endDate = parseISO(assignment.endDate);
            if (isWithinInterval(day, { start: startDate, end: endDate })) {
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

        {/* Daily Cells */}
        <div className="col-start-2 col-end-[-1] grid grid-cols-subgrid relative">
            {days.map((day, dayIndex) => {
                const dayKey = day.toISOString().split('T')[0];
                const totalAssignedQuantity = dailyUsage[dayKey] || 0;
                const utilization = line.dailyCap > 0 ? totalAssignedQuantity / line.dailyCap : 0;
                
                return (
                     <div key={day.toISOString()} className="relative border-r border-b">
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
                        const startDate = parseISO(assignment.startDate);
                        const endDate = parseISO(assignment.endDate);
                        
                        const startDay = differenceInDays(startDate, monthStart);
                        const duration = differenceInDays(endDate, startDate) + 1;
                        
                        const monthDays = days.length;
                        
                        if (startDay + duration <= 0 || startDay >= monthDays) {
                            return null;
                        }

                        const clampedStart = Math.max(startDay, 0);
                        const clampedEnd = Math.min(startDay + duration, monthDays);
                        const clampedDuration = clampedEnd - clampedStart;

                        if (clampedDuration <= 0) {
                            return null;
                        }

                        return (
                            <div
                                key={assignment.id}
                                className="h-10 self-center z-10 absolute"
                                style={{
                                    left: `calc(${clampedStart} * (100% / ${monthDays}))`,
                                    width: `calc(${clampedDuration} * (100% / ${monthDays}))`,
                                    top: `${trackIndex * 48 + 4}px`, // 48px per track, 4px for padding
                                    paddingRight: '2px'
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
