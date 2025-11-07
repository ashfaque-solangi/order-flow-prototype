
'use client';

import { Unit } from '@/lib/data';
import UnitCard from './unit-card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Factory } from 'lucide-react';

type UnitsSectionProps = {
  units: Unit[];
};

export default function UnitsSection({ units }: UnitsSectionProps) {
  return (
    <div className="flex flex-col">
      <h2 className="text-lg font-semibold mb-2 flex items-center"><Factory className="w-5 h-5 mr-2 text-primary" /> Production Units</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-4 pb-4">
          {units.map(unit => (
            <UnitCard key={unit.id} unit={unit} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

    