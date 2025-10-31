
'use client';

import { useMemo } from 'react';
import { Unit } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Factory } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

type UnitCardProps = {
  unit: Unit;
  onUnassign: (orderId: string, assignmentId: string, lineId: string) => void;
};

export default function UnitCard({ unit, onUnassign }: UnitCardProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: unit.id,
    data: {
      type: 'unit',
      unit,
    },
  });

  const assignedOrders = useMemo(() => {
    return unit.lines.flatMap(line => 
      line.assignments.map(a => ({...a, lineId: line.id, lineName: line.name }))
    ).sort((a,b) => a.order_num.localeCompare(b.order_num));
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
        "w-[300px] shrink-0 flex flex-col transition-all",
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
        <ScrollArea className="w-full h-full pr-3 -mr-3">
          <div className="space-y-2">
          {assignedOrders.length > 0 ? (
            assignedOrders.map(a => (
              <div key={a.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-slate-100 border shadow-sm">
                <div className="flex flex-col truncate w-full">
                  <span className="font-medium truncate" title={a.order_num}>{a.order_num}</span>
                  <span className="text-xs text-muted-foreground">{a.lineName}</span>
                </div>
                <Badge className="mx-2 shrink-0">{a.quantity.toLocaleString()}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onUnassign(a.orderId, a.id, a.lineId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No orders assigned.</p>
          )}
        </div>
        </ScrollArea>
      </CardFooter>
    </Card>
  );
}
