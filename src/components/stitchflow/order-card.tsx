
'use client';

import { Order } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Package, Hash, Tag, Move } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

type OrderCardProps = {
  order: Order;
  isDragging?: boolean;
};

export default function OrderCard({ order, isDragging }: OrderCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging: dndIsDragging } = useDraggable({
    id: order.id,
    data: {
      type: 'order',
      order,
    }
  });

  const isAssignable = order.qty.remaining > 0;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <Card 
      ref={isAssignable ? setNodeRef : null}
      style={style}
      className={cn(
        "w-full min-w-[260px] shrink-0 flex flex-col transition-shadow hover:shadow-lg",
        (dndIsDragging || isDragging) && "shadow-2xl z-50 scale-105",
        !isAssignable && "opacity-60 bg-slate-50",
        order.tentative && "border-dashed border-amber-500/80",
        "group"
      )}
    >
      <CardHeader className="flex-row justify-between items-center py-2 px-4">
        <CardTitle className="text-base font-semibold truncate">{order.order_num}</CardTitle>
        {order.tentative && <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 text-xs">Tentative</Badge>}
      </CardHeader>
      <CardContent className="py-2 px-4 text-sm space-y-1">
        <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Customer</span>
            <span className="font-medium truncate">{order.customer}</span>
        </div>
        <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Style</span>
            <span className="font-medium">{order.style}</span>
        </div>
        <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Order Qty</span>
            <span className="font-medium">{order.qty.total.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
            <span className="text-muted-foreground">ETD</span>
            <span className="font-medium">{format(parseISO(order.etd_date), 'M/d/yyyy')}</span>
        </div>
      </CardContent>
      <CardFooter className="p-2 px-4 flex justify-between items-center text-xs mt-auto bg-slate-50/70">
        <div className="text-muted-foreground">
          Planned: <Badge variant="secondary" className="font-bold">{order.qty.assigned.toLocaleString()}</Badge>
        </div>
        <div className="text-muted-foreground">
          Remaining: <Badge variant="destructive" className="font-bold">{order.qty.remaining.toLocaleString()}</Badge>
        </div>
        <div 
          className={cn("drag-indicator text-muted-foreground/50", isAssignable ? "cursor-grab touch-none" : "cursor-not-allowed")}
          {...(isAssignable ? attributes : {})}
          {...(isAssignable ? listeners : {})}
        >
          <Move className="w-4 h-4"/>
        </div>
      </CardFooter>
    </Card>
  );
}

    