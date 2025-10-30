
'use client';

import { useMemo } from 'react';
import { Unit, ProductionLine } from '@/lib/data';
import { getDaysInMonth, startOfMonth, format, getDate, addDays } from 'date-fns';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CalendarDays } from 'lucide-react';
import TimelineRow from './timeline/timeline-row';

type TimelineSectionProps = {
  units: Unit[];
  selectedMonth: Date;
  allLines: (ProductionLine & { unitName: string })[];
  orderColorMap: Record<string, string>;
};

export default function TimelineSection({ units, selectedMonth, allLines, orderColorMap }: TimelineSectionProps) {
  const { days, monthStart } = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const numDays = getDaysInMonth(selectedMonth);
    const days = Array.from({ length: numDays }, (_, i) => addDays(monthStart, i));
    return { days, monthStart };
  }, [selectedMonth]);

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
        <div className="relative">
          <div className="grid items-start" style={{ gridTemplateColumns: `180px minmax(0, 1fr)` }}>
            {/* Header */}
            <div className="sticky top-0 z-30 font-semibold text-sm text-muted-foreground pl-2 bg-card border-r border-b h-16 flex items-end pb-1">Line / Unit</div>
            <div className="sticky top-0 z-30 bg-card grid" style={{gridTemplateColumns: `repeat(${days.length}, minmax(48px, 1fr))`}}>
                {days.map(day => (
                <div key={day.toISOString()} className="text-center font-semibold text-sm h-16 flex flex-col justify-end border-r border-b last:border-r-0">
                    <div className='flex-grow' />
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full mx-auto ${isToday(day) ? "bg-primary text-primary-foreground" : ""}`}>
                    {format(day, 'd')}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1 mb-1">{format(day, 'EEE')}</span>
                </div>
                ))}
            </div>

            {/* Body */}
            {allLines.map((line, index) => (
              <TimelineRow 
                key={line.id} 
                line={line}
                days={days} 
                monthStart={monthStart}
                orderColorMap={orderColorMap}
              />
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
