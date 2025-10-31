

'use client';

import { useState, useMemo } from 'react';
import { initialOrders, initialUnits, Order, Unit } from '@/lib/data';
import AppHeader from '@/components/stitchflow/header';
import OrdersSection from '@/components/stitchflow/orders-section';
import UnitsSection from '@/components/stitchflow/units-section';
import TimelineSection from '@/components/stitchflow/timeline-section';
import AssignOrderModal from '@/components/stitchflow/modals/assign-order-modal';
import MoveAssignmentModal from '@/components/stitchflow/modals/move-assignment-modal';
import TentativeOrderModal from '@/components/stitchflow/modals/tentative-order-modal';
import FiltersModal from '@/components/stitchflow/modals/filters-modal';
import { useToast } from '@/hooks/use-toast';
import { validateCapacity } from '@/ai/flows/capacity-validation';
import { format, differenceInDays, isWithinInterval, startOfDay, parseISO } from 'date-fns';
import { DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import type { ProductionLine, Assignment } from '@/lib/data';
import { ClientOnlyDndProvider } from '@/components/stitchflow/dnd-provider';
import OrderCard from '@/components/stitchflow/order-card';
import TimelineAssignment from '@/components/stitchflow/timeline/timeline-assignment';


export type Filters = {
  customer: string[];
  oc: string[];
  etd: Date | undefined;
  style: string[];
  quantity_min: number | '';
  quantity_max: number | '';
  order_date_from: Date | undefined;
  order_date_to: Date | undefined;
  status: string[];
  oc_search: string;
};

type MoveAssignmentState = {
    assignment: Assignment;
    sourceLineId: string;
    targetLineId: string;
    newStartDate: Date;
} | null;

export default function StitchFlowPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filters, setFilters] = useState<Filters>({
    customer: [],
    oc: [],
    etd: undefined,
    style: [],
    quantity_min: '',
    quantity_max: '',
    order_date_from: undefined,
    order_date_to: undefined,
    status: [],
    oc_search: '',
  });

  const [isAssignModalOpen, setAssignModalOpen] = useState(false);
  const [isMoveModalOpen, setMoveModalOpen] = useState(false);
  const [moveAssignmentState, setMoveAssignmentState] = useState<MoveAssignmentState>(null);
  const [isTentativeModalOpen, setTentativeModalOpen] = useState(false);
  const [isFiltersModalOpen, setFiltersModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<Order | Assignment | null>(null);


  const { toast } = useToast();

  const handleReset = () => {
    setOrders(initialOrders);
    setUnits(initialUnits);
    setFilters({
      customer: [],
      oc: [],
      etd: undefined,
      style: [],
      quantity_min: '',
      quantity_max: '',
      order_date_from: undefined,
      order_date_to: undefined,
      status: [],
      oc_search: '',
    });
    toast({
      title: 'Data Reset',
      description: 'The application data has been restored to its initial state.',
    });
  };

  const handleOpenAssignModal = (orderId: string, unitId?: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order && order.qty.remaining > 0) {
      setSelectedOrderId(orderId);
      if (unitId) setSelectedUnitId(unitId);
      setAssignModalOpen(true);
    } else {
       toast({
        variant: 'destructive',
        title: 'Assignment Error',
        description: 'This order has no remaining quantity to assign.',
      });
    }
  };
  
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;
    if (activeData?.type === 'order') {
        const order = orders.find(o => o.id === active.id);
        if (order) setActiveItem(order);
    } else if (activeData?.type === 'assignment') {
        const assignment = activeData.assignment as Assignment;
        if(assignment) setActiveItem(assignment);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
  
    if (!active.id || !over?.id) return;
  
    const activeData = active.data.current;
    const overData = over.data.current;
  
    // Dragging an OrderCard to a UnitCard
    if (activeData?.type === 'order' && overData?.type === 'unit') {
      const orderId = active.id as string;
      const unitId = over.id as string;
      handleOpenAssignModal(orderId, unitId);
    }
  
    // Dragging an assignment within the timeline
    if (activeData?.type === 'assignment' && overData?.type === 'timeline-cell') {
      const assignment = activeData.assignment as Assignment;
      const sourceLineId = active.data.current?.lineId as string;
      const targetLineId = overData.lineId as string;
      const newStartDate = overData.date as Date;
  
      setMoveAssignmentState({ assignment, sourceLineId, targetLineId, newStartDate });
      setMoveModalOpen(true);
    }
  };


  const handleAssignOrder = async (
    orderId: string,
    assignments: { lineId: string; quantity: number }[],
    dates: { from: Date; to: Date }
  ): Promise<{ success: boolean; message?: string }> => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found' };

    const productionDays = differenceInDays(dates.to, dates.from) + 1;
    
    // Process all assignments at once
    for (const assignment of assignments) {
        if(assignment.quantity <= 0) continue;

        let targetLine: ProductionLine | undefined;
        let unitId: string | undefined;

        for (const unit of units) {
            const line = unit.lines.find((l) => l.id === assignment.lineId);
            if (line) {
                targetLine = line;
                unitId = unit.id;
                break;
            }
        }

        if (!targetLine || !unitId) {
          toast({ variant: 'destructive', title: 'Error', description: `Production line ${assignment.lineId} not found.` });
          continue;
        }
        
        const existingAssignmentsOnLine = targetLine.assignments.reduce((sum, a) => {
            const aStart = parseISO(a.startDate);
            const aEnd = parseISO(a.endDate);
            if(isWithinInterval(dates.from, {start: aStart, end: aEnd}) || isWithinInterval(dates.to, {start: aStart, end: aEnd})) {
                const assignmentDuration = differenceInDays(aEnd, aStart) + 1;
                return sum + (a.quantity / assignmentDuration);
            }
            return sum;
        }, 0) * productionDays;
        
        const validationInput = {
          orderId,
          unitId: unitId,
          quantity: assignment.quantity,
          etdDate: order.etd_date,
          dailyCap: targetLine.dailyCap * productionDays,
          assignedCapacity: existingAssignmentsOnLine,
        };
    
        try {
            const validationResult = await validateCapacity(validationInput);

            if (!validationResult.isValid) {
                const message = validationResult.reason || `The requested quantity of ${assignment.quantity.toLocaleString()} exceeds the remaining capacity.`;
                toast({
                    variant: 'destructive',
                    title: `Capacity Validation Failed for ${targetLine.name}`,
                    description: message,
                });
                return { success: false, message: message };
            }
        } catch (error) {
            console.error('AI Validation Error:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'An unexpected error occurred during AI validation.',
            });
            return { success: false, message: 'An unexpected error occurred.' };
        }
    }


    // If all validations passed, proceed with state updates
    let tempUnits = [...units];
    let totalAssignedQuantity = 0;

    for (const assignment of assignments) {
       if(assignment.quantity <= 0) continue;

        totalAssignedQuantity += assignment.quantity;
        let unitIndex = -1;
        let lineIndex = -1;

        for (let i = 0; i < tempUnits.length; i++) {
            const lineIdx = tempUnits[i].lines.findIndex((l) => l.id === assignment.lineId);
            if (lineIdx !== -1) {
                unitIndex = i;
                lineIndex = lineIdx;
                break;
            }
        }

        if (unitIndex !== -1 && lineIndex !== -1) {
            const newAssignment: Assignment = {
                id: `as-${Date.now()}-${Math.random()}`,
                orderId,
                order_num: order.order_num,
                quantity: assignment.quantity,
                startDate: format(dates.from, 'yyyy-MM-dd'),
                endDate: format(dates.to, 'yyyy-MM-dd'),
                tentative: order.tentative,
            };

            const newLines = [...tempUnits[unitIndex].lines];
            newLines[lineIndex] = {
                ...newLines[lineIndex],
                assignments: [...newLines[lineIndex].assignments, newAssignment],
            };
            tempUnits[unitIndex] = {
                ...tempUnits[unitIndex],
                lines: newLines,
            };
        }
    }
    
    setUnits(tempUnits);

    setOrders(prevOrders =>
      prevOrders.map(o =>
        o.id === orderId
          ? {
              ...o,
              qty: {
                total: o.qty.total,
                assigned: o.qty.assigned + totalAssignedQuantity,
                remaining: o.qty.remaining - totalAssignedQuantity,
              },
              status: o.qty.remaining - totalAssignedQuantity > 0 ? 'Partially Assigned' : 'Fully Assigned',
            }
          : o
      )
    );

    toast({
      title: 'Success!',
      description: `Order ${order.order_num} assigned successfully.`,
    });
    return { success: true };
  };
  
  const handleUnassignOrder = (orderId: string, assignmentId: string, lineId: string) => {
    let unassignedQuantity = 0;
    
    setUnits(prevUnits => prevUnits.map(unit => ({
      ...unit,
      lines: unit.lines.map(line => {
        if (line.id === lineId) {
          const assignmentToRemove = line.assignments.find(a => a.id === assignmentId);
          if (assignmentToRemove) {
            unassignedQuantity = assignmentToRemove.quantity;
          }
          return {
            ...line,
            assignments: line.assignments.filter(a => a.id !== assignmentId),
          };
        }
        return line;
      })
    })));

    setOrders(prevOrders => prevOrders.map(order => {
      if (order.id === orderId) {
        const newAssigned = order.qty.assigned - unassignedQuantity;
        return {
          ...order,
          qty: {
            total: order.qty.total,
            assigned: newAssigned,
            remaining: order.qty.total - newAssigned,
          },
          status: newAssigned > 0 ? 'Partially Assigned' : 'Planned',
        };
      }
      return order;
    }));
    
    toast({
        title: 'Order Unassigned',
        description: 'The order has been removed from the production line.',
    });
  };

  const handleAddTentativeOrder = (newOrderData: Omit<Order, 'id' | 'qty' | 'status'> & { qty: number }) => {
    const newOrder: Order = {
      ...newOrderData,
      id: `ord-${Date.now()}`,
      qty: {
        total: newOrderData.qty,
        assigned: 0,
        remaining: newOrderData.qty,
      },
      status: 'Planned',
      tentative: true,
    };
    setOrders(prev => [newOrder, ...prev]);
    toast({
      title: 'Tentative Order Created',
      description: `Order ${newOrder.order_num} has been added to the list.`,
    });
  };

  const handleMoveAssignment = (
    assignment: Assignment,
    sourceLineId: string,
    targetLineId: string,
    newStartDate: Date,
    quantityToMove: number
): { success: boolean; message?: string } => {
    const allLines = units.flatMap(u => u.lines);
    const sourceLine = allLines.find(l => l.id === sourceLineId);
    const targetLine = allLines.find(l => l.id === targetLineId);

    if (!sourceLine || !targetLine) {
        const message = 'Could not find source or target line.';
        toast({ variant: 'destructive', title: 'Error', description: message });
        return { success: false, message };
    }
    
    const duration = differenceInDays(parseISO(assignment.endDate), parseISO(assignment.startDate));
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + duration);

    // Capacity check on target line for the new date range
    const totalCapacityOnTarget = targetLine.dailyCap * (duration + 1);
    const assignedOnTargetDuringDrop = targetLine.assignments
        .filter(a => a.id !== assignment.id) // Exclude the assignment being moved
        .reduce((sum, a) => {
            const aStart = parseISO(a.startDate);
            const aEnd = parseISO(a.endDate);
            if(isWithinInterval(newStartDate, {start: aStart, end: aEnd}) || isWithinInterval(newEndDate, {start: aStart, end: aEnd})) {
                const assignmentDuration = differenceInDays(aEnd, aStart) + 1;
                return sum + (a.quantity / assignmentDuration);
            }
            return sum;
        }, 0) * (duration + 1);
    
    const availableCapacity = totalCapacityOnTarget - assignedOnTargetDuringDrop;

    if (quantityToMove > availableCapacity) {
        const message = `Not enough capacity on ${targetLine.name}. Required: ${quantityToMove.toLocaleString()}, Available: ${Math.round(availableCapacity).toLocaleString()}`;
        toast({ variant: 'destructive', title: 'Capacity Exceeded', description: message });
        return { success: false, message };
    }
    
    setUnits(prevUnits => {
        let newUnits = JSON.parse(JSON.stringify(prevUnits));

        let sourceUnit = newUnits.find((u: Unit) => u.lines.some(l => l.id === sourceLineId));
        let targetUnit = newUnits.find((u: Unit) => u.lines.some(l => l.id === targetLineId));
        
        let sourceLine = sourceUnit?.lines.find((l: ProductionLine) => l.id === sourceLineId);
        let targetLine = targetUnit?.lines.find((l: ProductionLine) => l.id === targetLineId);

        if (!sourceLine || !targetLine) return prevUnits;

        const originalAssignment = sourceLine.assignments.find((a: Assignment) => a.id === assignment.id);
        if (!originalAssignment) return prevUnits;

        const remainingQuantity = originalAssignment.quantity - quantityToMove;

        // Update or remove from source line
        if (remainingQuantity > 0) {
            originalAssignment.quantity = remainingQuantity;
        } else {
            sourceLine.assignments = sourceLine.assignments.filter((a: Assignment) => a.id !== assignment.id);
        }

        // Add to target line
        const existingAssignmentOnTarget = targetLine.assignments.find(
            (a: Assignment) => a.orderId === assignment.orderId && a.startDate === format(newStartDate, 'yyyy-MM-dd') && a.endDate === format(newEndDate, 'yyyy-MM-dd')
        );

        if (sourceLineId === targetLineId && existingAssignmentOnTarget && originalAssignment.startDate === format(newStartDate, 'yyyy-MM-dd')) {
            // It's the same assignment, do nothing extra
        } else if (existingAssignmentOnTarget) {
            existingAssignmentOnTarget.quantity += quantityToMove;
        } else {
            const newAssignment: Assignment = {
                ...assignment,
                id: `as-${Date.now()}-${Math.random()}`,
                quantity: quantityToMove,
                startDate: format(newStartDate, 'yyyy-MM-dd'),
                endDate: format(newEndDate, 'yyyy-MM-dd'),
            };
            targetLine.assignments.push(newAssignment);
        }
        
        return newUnits;
    });

    toast({ title: 'Assignment Moved', description: `Moved ${quantityToMove.toLocaleString()} units of ${assignment.order_num} to ${targetLine.name}.` });
    return { success: true };
};
  
  const uniqueFilterValues = useMemo(() => {
    const customers = [...new Set(initialOrders.map(o => o.customer))];
    const ocs = [...new Set(initialOrders.map(o => o.order_num))];
    const styles = [...new Set(initialOrders.map(o => o.style))];
    const statuses = [...new Set(initialOrders.map(o => o.status))];
    return { customers, ocs, styles, statuses };
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (filters.customer.length > 0 && !filters.customer.includes(order.customer)) return false;
      if (filters.oc.length > 0 && !filters.oc.includes(order.order_num)) return false;
      if (filters.etd && format(new Date(order.etd_date), 'yyyy-MM-dd') !== format(filters.etd, 'yyyy-MM-dd')) return false;
      if (filters.style.length > 0 && !filters.style.includes(order.style)) return false;
      if (filters.status.length > 0 && !filters.status.includes(order.status)) return false;
      if (filters.oc_search && !order.order_num.toLowerCase().includes(filters.oc_search.toLowerCase())) return false;
      if (filters.quantity_min !== '' && order.qty.total < filters.quantity_min) return false;
      if (filters.quantity_max !== '' && order.qty.total > filters.quantity_max) return false;
      if (filters.order_date_from && new Date(order.order_date) < filters.order_date_from) return false;
      if (filters.order_date_to && new Date(order.order_date) > filters.order_date_to) return false;
      
      return true;
    });
  }, [orders, filters]);
  
  const availableOrders = useMemo(() => {
    return filteredOrders.filter(o => o.qty.remaining > 0).sort((a,b) => new Date(a.etd_date).getTime() - new Date(b.etd_date).getTime());
  }, [filteredOrders]);

  const selectedOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId) || null;
  }, [selectedOrderId, orders]);

  const selectedUnit = useMemo(() => {
    if (!selectedUnitId) return null;
    return units.find(u => u.id === selectedUnitId) || null;
  }, [selectedUnitId, units]);
  
  const allLines = useMemo(() => units.flatMap(unit => 
    unit.lines.map(line => ({ ...line, unitName: unit.name }))
  ).sort((a,b) => a.name.localeCompare(b.name)), [units]);
  
  return (
    <ClientOnlyDndProvider
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <AppHeader
          onReset={handleReset}
          onAddTentative={() => setTentativeModalOpen(true)}
          onOpenFilters={() => setFiltersModalOpen(true)}
          filters={filters}
          setFilters={setFilters}
          uniqueCustomers={uniqueFilterValues.customers}
          uniqueOCs={uniqueFilterValues.ocs}
          availableOrdersCount={availableOrders.length}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
        />
        <main className="flex flex-col flex-1 p-4 lg:p-6 gap-6 overflow-y-auto">
          <OrdersSection orders={availableOrders} />
          <UnitsSection units={units} onUnassign={handleUnassignOrder} />
          <TimelineSection units={units} selectedMonth={selectedMonth} allLines={allLines} />
        </main>

        {isAssignModalOpen && selectedOrder && (
          <AssignOrderModal
            isOpen={isAssignModalOpen}
            onClose={() => {
              setAssignModalOpen(false);
              setSelectedUnitId(null);
              setSelectedOrderId(null);
            }}
            order={selectedOrder}
            unit={selectedUnit || units.find(u => u.lines.some(l => selectedUnitId && u.id === selectedUnitId))}
            units={units}
            onAssign={handleAssignOrder}
          />
        )}
        
        {isMoveModalOpen && moveAssignmentState && (
            <MoveAssignmentModal
                isOpen={isMoveModalOpen}
                onClose={() => {
                    setMoveModalOpen(false);
                    setMoveAssignmentState(null);
                }}
                assignmentState={moveAssignmentState}
                onMove={handleMoveAssignment}
                allLines={allLines}
            />
        )}

        {isTentativeModalOpen && (
          <TentativeOrderModal
            isOpen={isTentativeModalOpen}
            onClose={() => setTentativeModalOpen(false)}
            onAddOrder={handleAddTentativeOrder}
          />
        )}

        {isFiltersModalOpen && (
          <FiltersModal
            isOpen={isFiltersModalOpen}
            onClose={() => setFiltersModalOpen(false)}
            filters={filters}
            setFilters={setFilters}
            uniqueValues={uniqueFilterValues}
          />
        )}
      </div>
       <DragOverlay>
        {activeItem ? (
          'qty' in activeItem ? (
            <OrderCard order={activeItem} isDragging />
          ) : (
             <div style={{
                width: `${Math.max(40, (differenceInDays(parseISO(activeItem.endDate), parseISO(activeItem.startDate)) + 1) * 40)}px`,
                height: '40px'
            }}>
                <TimelineAssignment
                    assignment={activeItem as Assignment & { lineId: string }}
                    isDragging
                />
            </div>
          )
        ) : null}
      </DragOverlay>
    </ClientOnlyDndProvider>
  );
}
