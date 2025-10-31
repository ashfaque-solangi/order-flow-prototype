

'use client';

import { Order } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tag, Users, Calendar, Package, Hash, CheckCircle, CircleDotDashed } from 'lucide-react';
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
      ref={isAssignable ? setNodeRef : null}
      style={style}
      className={cn(
        "w-[320px] shrink-0 flex flex-col transition-shadow hover:shadow-lg",
        (dndIsDragging || isDragging) && "shadow-2xl z-50 scale-105",
        !isAssignable && "opacity-60 bg-slate-50",
        isAssignable ? "cursor-grab touch-none" : "cursor-not-allowed",
        order.tentative && "border-dashed border-amber-500/80"
      )}
      {...(isAssignable ? attributes : {})}
      {...(isAssignable ? listeners : {})}
    >
      <CardHeader className="pb-3">
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
            {order.tentative && <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50">Tentative</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex-1 text-sm pt-3 flex flex-col">
        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-muted-foreground">
            <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span>{order.style}</span>
            </div>
             <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>ETD: {order.etd_date}</span>
            </div>
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-3 gap-2 text-center">
            <div>
                <Badge variant="secondary" className="w-full justify-center py-1">
                     <Hash className="w-3.5 h-3.5 mr-1.5"/> Total
                </Badge>
                <p className="font-bold text-lg mt-1">{order.qty.total.toLocaleString()}</p>
            </div>
            <div>
                <Badge variant="secondary" className="w-full justify-center py-1">
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5"/> Assigned
                </Badge>
                <p className="font-bold text-lg mt-1">{order.qty.assigned.toLocaleString()}</p>
            </div>
            <div>
                <Badge variant="secondary" className="w-full justify-center py-1">
                    <CircleDotDashed className="w-3.5 h-3.5 mr-1.5"/> Remaining
                </Badge>
                <p className="font-bold text-lg mt-1 text-primary">{order.qty.remaining.toLocaleString()}</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
