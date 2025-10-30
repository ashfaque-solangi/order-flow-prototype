
'use client';

import { useMemo } from 'react';
import { Unit } from '@/lib/data';
import { getDaysInMonth, startOfMonth, format, getDate, addDays, eachDayOfInterval } from 'date-fns';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CalendarDays } from 'lucide-react';
import TimelineRow from './timeline/timeline-row';

type TimelineSectionProps = {
  units: Unit[];
  selectedMonth: Date;
};

export default function TimelineSection({ units, selectedMonth }: TimelineSectionProps) {
  const { days, monthStart } = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const numDays = getDaysInMonth(selectedMonth);
    const days = Array.from({ length: numDays }, (_, i) => addDays(monthStart, i));
    return { days, monthStart };
  }, [selectedMonth]);

  const allLines = useMemo(() => units.flatMap(unit => 
    unit.lines.map(line => ({ ...line, unitName: unit.name }))
  ).sort((a,b) => a.name.localeCompare(b.name)), [units]);
  
  const isToday = (day: Date) => {
    const today = new Date();
    return (
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear()
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <h2 className="text-lg font-semibold mb-2 flex items-center"><CalendarDays className="w-5 h-5 mr-2 text-primary" /> Production Line Timeline</h2>
      <ScrollArea className="flex-1 rounded-lg border bg-card">
        <div className="relative p-4">
          <div className="grid gap-y-2" style={{ gridTemplateColumns: `180px repeat(${days.length}, minmax(40px, 1fr))` }}>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-card font-semibold text-sm text-muted-foreground pl-2">Line / Unit</div>
            {days.map(day => (
              <div key={day.toISOString()} className="sticky top-0 z-10 bg-card text-center font-semibold text-sm">
                <span className={`flex items-center justify-center w-8 h-8 rounded-full mx-auto ${isToday(day) ? "bg-primary text-primary-foreground" : ""}`}>
                  {format(day, 'd')}
                </span>
                 <span className="text-xs text-muted-foreground">{format(day, 'EEE')}</span>
              </div>
            ))}

            {/* Body */}
            {allLines.map((line) => (
              <TimelineRow 
                key={line.id} 
                line={line} 
                days={days} 
                monthStart={monthStart}
              />
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
