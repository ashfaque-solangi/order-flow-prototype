
'use client';

import { useMemo } from 'react';
import { Unit } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Factory, X } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '../ui/button';

type UnitCardProps = {
  unit: Unit;
  onUnassign: (orderId: string, assignmentId: string | null, lineId: string | null) => void;
};

export default function UnitCard({ unit, onUnassign }: UnitCardProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: unit.id,
    data: {
      type: 'unit',
      unit,
    },
  });

  const groupedAssignments = useMemo(() => {
    const assignments = unit.lines.flatMap(line => 
      line.assignments.map(a => ({...a, lineId: line.id, lineName: line.name }))
    );

    const groups: Record<string, { orderId: string, totalQuantity: number, details: typeof assignments }> = {};

    assignments.forEach(a => {
        if (!groups[a.order_num]) {
            groups[a.order_num] = { orderId: a.orderId, totalQuantity: 0, details: [] };
        }
        groups[a.order_num].totalQuantity += a.quantity;
        groups[a.order_num].details.push(a);
    });

    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [unit]);

  const { totalCapacity, totalAssigned } = useMemo(() => {
    const monthlyMultiplier = 30; // Assuming a 30-day month
    let totalCapacity = 0;
    let totalAssigned = 0;
    unit.lines.forEach(line => {
      totalCapacity += line.dailyCap * monthlyMultiplier;
      totalAssigned += line.assignments.reduce((sum, a) => sum + a.quantity, 0);
    });
    return { totalCapacity, totalAssigned };
  }, [unit.lines]);


  return (
    <Card 
      ref={setNodeRef}
      className={cn(
        "w-[300px] shrink-0 flex flex-col transition-all h-[360px]",
        isOver && "ring-2 ring-primary ring-offset-2 scale-105"
      )}
    >
      <CardHeader className="flex-row justify-between items-center py-2">
        <CardTitle className="text-base font-semibold">{unit.name}</CardTitle>
        <Badge variant="secondary">Unit Cap: {totalCapacity.toLocaleString()}</Badge>
      </CardHeader>
      <CardContent className="py-3 text-sm">
        <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Planned</span>
            <Badge variant="secondary" className="font-bold text-base">{totalAssigned.toLocaleString()}</Badge>
            <span className="text-muted-foreground">Remaining</span>
            <Badge variant="destructive" className="font-bold text-base">{(totalCapacity - totalAssigned).toLocaleString()}</Badge>
        </div>
      </CardContent>
      <CardFooter className="py-2 flex-1 flex flex-col min-h-0">
        <p className='text-sm font-medium self-start mb-2'>Assigned Orders</p>
        <ScrollArea className="w-full h-full pr-3 -mr-3">
          <div className="space-y-2">
          {groupedAssignments.length > 0 ? (
             <div className="w-full space-y-2">
              {groupedAssignments.map(([orderNum, group]) => (
                <div key={orderNum} className="group flex items-center justify-between text-sm p-2 rounded-md bg-slate-100 border shadow-sm">
                    <span className="font-medium truncate flex-1 text-left" title={orderNum}>{orderNum}</span>
                    <Badge className="mx-2 shrink-0">{group.totalQuantity.toLocaleString()}</Badge>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-muted-foreground hover:bg-red-100 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onUnassign(group.orderId, null, null)}
                        >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Unassign All</span>
                    </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No orders assigned.</p>
          )}
        </div>
        </ScrollArea>
      </CardFooter>
    </Card>
  );
}
