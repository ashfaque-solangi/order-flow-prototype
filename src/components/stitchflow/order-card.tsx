
'use client';

import { Order } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tag, Users, Hash, Calendar, CheckCircle, Package } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

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
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-[320px] shrink-0 flex flex-col transition-shadow hover:shadow-lg",
        (dndIsDragging || isDragging) && "shadow-2xl z-50 scale-105",
        !isAssignable && "opacity-60 bg-slate-50",
        isAssignable ? "cursor-grab touch-none" : "cursor-not-allowed"
      )}
      {...attributes}
      {...listeners}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    {order.order_num}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                    <Users className="w-3.5 h-3.5" />
                    {order.customer}
                </CardDescription>
            </div>
            {order.tentative && <Badge variant="outline" className="border-amber-500 text-amber-600">Tentative</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex-1 text-sm pt-4 flex flex-col">
        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-muted-foreground">
            <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span>{order.style}</span>
            </div>
             <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>ETD: {order.etd_date}</span>
            </div>
             <div className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                <span>Total: {order.qty.total.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Assigned: {order.qty.assigned.toLocaleString()}</span>
            </div>
        </div>
        <Separator className="my-3" />
        <div className="flex justify-between items-center font-medium mt-auto">
            <span>Remaining Qty:</span>
            <span className="text-primary text-lg">{order.qty.remaining.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
