
'use client';

import { useMemo } from 'react';
import { Unit } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Factory, Workflow } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import CapacityBar from './capacity-bar';

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
    );
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
        "w-[420px] shrink-0 flex flex-col transition-all",
        isOver && "ring-2 ring-primary ring-offset-2 scale-105"
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
                <Factory className="w-5 h-5 text-primary" />
                {unit.name}
            </CardTitle>
            <Badge variant="secondary">{unit.lines.length} Lines</Badge>
        </div>
        <CardDescription>Monthly Capacity Utilization</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div>
          <CapacityBar total={totalCapacity} used={totalAssigned} />
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Workflow className="w-4 h-4"/> Assigned Orders</h4>
          <ScrollArea className="flex-1 pr-3 -mr-3">
             <div className="space-y-2">
            {assignedOrders.length > 0 ? (
              assignedOrders.map(a => (
                <div key={a.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-secondary/50">
                  <div className="flex flex-col">
                    <span className="font-medium">{a.order_num}</span>
                    <span className="text-xs text-muted-foreground">Qty: {a.quantity.toLocaleString()} on {a.lineName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onUnassign(a.orderId, a.id, a.lineId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No orders assigned.</p>
            )}
          </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
