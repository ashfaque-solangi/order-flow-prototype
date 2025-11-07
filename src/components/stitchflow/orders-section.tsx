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
      <ScrollArea className="h-auto pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {orders.length > 0 ? (
            orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No available orders match the current filters.
            </div>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

    