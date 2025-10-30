'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import OrderCard from '@/components/stitchflow/order-card';
import type { Order } from '@/lib/data';

type ClientOnlyDndProviderProps = {
  children: React.ReactNode;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  activeOrder: Order | null;
};

export function ClientOnlyDndProvider({
  children,
  onDragStart,
  onDragEnd,
  activeOrder,
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
        {activeOrder ? <OrderCard order={activeOrder} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
