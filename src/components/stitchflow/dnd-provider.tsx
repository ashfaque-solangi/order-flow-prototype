
'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';

type ClientOnlyDndProviderProps = {
  children: React.ReactNode;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
};

export function ClientOnlyDndProvider({
  children,
  onDragStart,
  onDragEnd,
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
    </DndContext>
  );
}
