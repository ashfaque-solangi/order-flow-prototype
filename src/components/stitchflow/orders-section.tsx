'use client';

import { Order } from '@/lib/data';
import OrderCard from './order-card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';

type OrdersSectionProps = {
  orders: Order[];
};

export default function OrdersSection({ orders }: OrdersSectionProps) {
  return (
    <div className="flex flex-col">
      <h2 className="text-lg font-semibold mb-2 flex items-center"><FileText className="w-5 h-5 mr-2 text-primary"/> Available Orders</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-4 pb-4">
          {orders.length > 0 ? (
            orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <div className="w-full text-center py-8 text-muted-foreground">
              No available orders match the current filters.
            </div>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
