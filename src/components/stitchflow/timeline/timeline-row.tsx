
'use client';

import { useMemo } from 'react';
import { ProductionLine, Assignment } from '@/lib/data';
import { differenceInDays, parseISO, isWithinInterval, areIntervalsOverlapping, startOfDay } from 'date-fns';
import TimelineAssignment from './timeline-assignment';
import DailyCapacityChart from './daily-capacity-indicator';
import TimelineCell from './timeline-cell';

type TimelineRowProps = {
  line: ProductionLine & { unitName: string };
  days: Date[];
  monthStart: Date;
  orderColorMap: Record<string, string>;
};

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
  
  const totalAssigned = useMemo(() => line.assignments.reduce((sum, a) => sum + a.quantity, 0), [line.assignments]);

  const assignmentTracks = useMemo(() => getAssignmentLayout(line.assignments), [line.assignments]);
  const trackHeight = 36;
  const chartHeight = 24;
  const rowHeight = useMemo(() => (Math.max(1, assignmentTracks.length) * trackHeight) + chartHeight + 8, [assignmentTracks]); // 8 for padding


  return (
    <div className="contents group">
        {/* Row Header */}
        <div 
            className="text-sm p-2 sticky left-0 bg-card z-20 border-r border-b group-hover:bg-muted/50 flex flex-col justify-center"
            style={{ height: `${rowHeight}px` }}
        >
            <p className="font-semibold">{line.name}</p>
            <p className="text-xs text-muted-foreground">{line.unitName}</p>
            <div className='mt-auto text-xs text-muted-foreground pt-1'>
                <p>Cap: {line.dailyCap.toLocaleString()}/day</p>
                <p>Assigned: {totalAssigned.toLocaleString()}</p>
            </div>
        </div>

        {/* Daily Cells & Assignments Grid */}
        <div 
            className="col-start-2 col-end-[-1] grid relative border-b"
            style={{
                gridTemplateColumns: `repeat(${days.length}, minmax(48px, 1fr))`,
                gridAutoRows: `${trackHeight}px`,
                height: `${rowHeight}px`,
            }}
        >
            {/* Background droppable cells */}
             {days.map((day, dayIndex) => (
                <div key={day.toISOString()} className="h-full w-full border-r relative" style={{gridColumn: dayIndex+1}}>
                   <TimelineCell lineId={line.id} date={day} />
                </div>
            ))}

            {/* Daily Capacity Chart as background */}
            <div className='absolute bottom-1 left-0 right-0 h-6' style={{gridColumn: `1 / -1`, gridRow: 1}}>
                <DailyCapacityChart
                    days={days}
                    dailyUsage={dailyUsage}
                    dailyCap={line.dailyCap}
                    lineId={line.id}
                />
            </div>

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
                                className="h-8 self-center z-10"
                                style={{
                                    gridColumn: `${clampedStart + 1} / span ${clampedDuration}`,
                                    gridRow: `${trackIndex + 1}`,
                                    padding: '2px'
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

    