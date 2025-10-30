
'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDndMonitor,
} from '@dnd-kit/core';
import OrderCard from '@/components/stitchflow/order-card';
import type { Order, Assignment } from '@/lib/data';
import TimelineAssignment from './timeline/timeline-assignment';

type ClientOnlyDndProviderProps = {
  children: React.ReactNode;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  activeItem: Order | Assignment | null;
};

function DraggableOverlay({ activeItem }: { activeItem: Order | Assignment | null }) {
    if (!activeItem) return null;

    if ('order_num' in activeItem && 'qty' in activeItem) { // It's an Order
        return <OrderCard order={activeItem} isDragging />;
    }
    
    if ('startDate' in activeItem) { // It's an Assignment
        const duration = differenceInDays(new Date(activeItem.endDate), new Date(activeItem.startDate)) + 1;
        return (
            <div style={{ width: `${duration * 40}px` }}>
                <TimelineAssignment
                    assignment={activeItem}
                    color="bg-blue-500"
                    isDragging
                />
            </div>
        );
    }
    
    return null;
}


export function ClientOnlyDndProvider({
  children,
  onDragStart,
  onDragEnd,
  activeItem,
}: ClientOnlyDndProviderProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      {children}
      <DragOverlay>
        {activeItem ? <DraggableOverlay activeItem={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}


function differenceInDays(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}
