
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
import AutoPlanModal from '@/components/stitchflow/modals/auto-plan-modal';
import FiltersModal from '@/components/stitchflow/modals/filters-modal';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, isWithinInterval, startOfDay, parseISO, areIntervalsOverlapping, getDaysInMonth, startOfMonth, endOfMonth, addDays, max, eachDayOfInterval } from 'date-fns';
import { DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import type { ProductionLine, Assignment } from '@/lib/data';
import { ClientOnlyDndProvider } from '@/components/stitchflow/dnd-provider';
import OrderCard from '@/components/stitchflow/order-card';
import TimelineAssignment from '@/components/stitchflow/timeline/timeline-assignment';
import { DateRange } from 'react-day-picker';


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
  const [isAutoPlanModalOpen, setAutoPlanModalOpen] = useState(false);
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
    newAssignments: { lineId: string; quantity: number }[],
    dates: { from: Date; to: Date }
  ): Promise<{ success: boolean; message?: string }> => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found' };
  
    const allLines = units.flatMap(u => u.lines);
    const assignmentDays = eachDayOfInterval({ start: dates.from, end: dates.to });
    const durationInDays = differenceInDays(dates.to, dates.from) + 1;
  
    // --- Validation Phase ---
    for (const newAssignment of newAssignments) {
      if (newAssignment.quantity <= 0) continue;
  
      const targetLine = allLines.find((l) => l.id === newAssignment.lineId);
      if (!targetLine) {
        return { success: false, message: `Production line ${newAssignment.lineId} not found.` };
      }
      
      const newAssignmentDailyQty = newAssignment.quantity / durationInDays;
  
      for (const day of assignmentDays) {
        const dayStart = startOfDay(day);
  
        // Calculate the total quantity ALREADY assigned to this line on this specific day
        const existingAssignedOnDay = targetLine.assignments.reduce((sum, existingAssignment) => {
          const existingStart = startOfDay(parseISO(existingAssignment.startDate));
          const existingEnd = startOfDay(parseISO(existingAssignment.endDate));
          
          if (isWithinInterval(dayStart, { start: existingStart, end: existingEnd })) {
            const duration = differenceInDays(existingEnd, existingStart) + 1;
            return sum + (existingAssignment.quantity / duration);
          }
          return sum;
        }, 0);
  
        const projectedTotal = existingAssignedOnDay + newAssignmentDailyQty;
        const epsilon = 0.001; 
  
        if (projectedTotal > targetLine.dailyCap + epsilon) {
          const message = `On ${format(day, 'MMM d')}, line ${targetLine.name} will exceed its daily capacity. It has ${Math.floor(existingAssignedOnDay).toLocaleString()} units assigned. Adding ${Math.ceil(newAssignmentDailyQty).toLocaleString()} units would reach ${Math.ceil(projectedTotal).toLocaleString()} of ${targetLine.dailyCap.toLocaleString()} available.`;
          return { success: false, message };
        }
      }
    }
  
    // --- State Update Phase ---
    let tempUnits = JSON.parse(JSON.stringify(units));
    let totalAssignedQuantity = 0;
  
    for (const assignment of newAssignments) {
      if (assignment.quantity <= 0) continue;
  
      totalAssignedQuantity += assignment.quantity;
      let unitIndex = -1;
      let lineIndex = -1;
  
      for (let i = 0; i < tempUnits.length; i++) {
        const lineIdx = tempUnits[i].lines.findIndex((l: ProductionLine) => l.id === assignment.lineId);
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
  
  const handleUnassignOrder = (orderId: string, assignmentId: string | null, lineId: string | null) => {
    let totalUnassignedQuantity = 0;
    
    // If assignmentId and lineId are provided, unassign a single assignment
    if (assignmentId && lineId) {
      setUnits(prevUnits => prevUnits.map(unit => ({
        ...unit,
        lines: unit.lines.map(line => {
          if (line.id === lineId) {
            const assignmentToRemove = line.assignments.find(a => a.id === assignmentId);
            if (assignmentToRemove) {
              totalUnassignedQuantity = assignmentToRemove.quantity;
              return {
                ...line,
                assignments: line.assignments.filter(a => a.id !== assignmentId),
              };
            }
          }
          return line;
        })
      })));
    } else {
      // Unassign ALL assignments for a given orderId (from the UnitCard)
      setUnits(prevUnits => prevUnits.map(unit => ({
        ...unit,
        lines: unit.lines.map(line => {
            const assignmentsToKeep = line.assignments.filter(a => a.orderId !== orderId);
            const assignmentsToRemove = line.assignments.filter(a => a.orderId === orderId);
            const unassignedQty = assignmentsToRemove.reduce((sum, a) => sum + a.quantity, 0);
            totalUnassignedQuantity += unassignedQty;
            return {
                ...line,
                assignments: assignmentsToKeep,
            };
        })
      })));
    }

    setOrders(prevOrders => prevOrders.map(order => {
      if (order.id === orderId) {
        const newAssigned = order.qty.assigned - totalUnassignedQuantity;
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
        description: 'The assignment(s) have been removed from the production schedule.',
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
        return { success: false, message };
    }
    
    const durationDays = differenceInDays(startOfDay(parseISO(assignment.endDate)), startOfDay(parseISO(assignment.startDate))) + 1;
    const newEndDate = addDays(newStartDate, durationDays - 1);
    const newInterval = { start: startOfDay(newStartDate), end: startOfDay(newEndDate) };

    // --- Validation Phase ---
    const dailyQtyToMove = quantityToMove / durationDays;

    for (const day of eachDayOfInterval(newInterval)) {
        const dayStart = startOfDay(day);
        const existingAssignedOnDay = targetLine.assignments.reduce((sum, existingAssignment) => {
            // When moving within the same line, the original assignment is not part of the "existing" load
            if (sourceLineId === targetLineId && existingAssignment.id === assignment.id) return sum;

            const existingStart = startOfDay(parseISO(existingAssignment.startDate));
            const existingEnd = startOfDay(parseISO(existingAssignment.endDate));
            if (isWithinInterval(dayStart, { start: existingStart, end: existingEnd })) {
                const duration = differenceInDays(existingEnd, existingStart) + 1;
                return sum + (existingAssignment.quantity / duration);
            }
            return sum;
        }, 0);

        const projectedTotal = existingAssignedOnDay + dailyQtyToMove;
        const epsilon = 0.001;

        if (projectedTotal > targetLine.dailyCap + epsilon) {
            const message = `On ${format(day, 'MMM d')}, line ${targetLine.name} will exceed its daily capacity. Moving ${Math.ceil(dailyQtyToMove).toLocaleString()} units/day would result in ${Math.ceil(projectedTotal).toLocaleString()} / ${targetLine.dailyCap.toLocaleString()} capacity.`;
            return { success: false, message };
        }
    }
    
    // --- State Update Phase ---
    setUnits(prevUnits => {
        let newUnits = JSON.parse(JSON.stringify(prevUnits));

        let sourceUnit = newUnits.find((u: Unit) => u.lines.some(l => l.id === sourceLineId));
        let targetUnit = newUnits.find((u: Unit) => u.lines.some(l => l.id === targetLineId));
        
        let foundSourceLine = sourceUnit?.lines.find((l: ProductionLine) => l.id === sourceLineId);
        let foundTargetLine = targetUnit?.lines.find((l: ProductionLine) => l.id === targetLineId);

        if (!foundSourceLine || !foundTargetLine) return prevUnits;

        const originalAssignmentIdx = foundSourceLine.assignments.findIndex((a: Assignment) => a.id === assignment.id);
        if (originalAssignmentIdx === -1) {
            // This can happen if a move is initiated within the same line. The source might be in a different line instance.
            // Find the actual source line again in the newUnits array.
            newUnits.forEach((u: Unit) => {
                const line = u.lines.find((l: ProductionLine) => l.id === sourceLineId);
                if (line) {
                    const idx = line.assignments.findIndex((a: Assignment) => a.id === assignment.id);
                    if (idx !== -1) {
                        foundSourceLine = line;
                    }
                }
            });
            const newOriginalAssignmentIdx = foundSourceLine.assignments.findIndex((a: Assignment) => a.id === assignment.id);
             if (newOriginalAssignmentIdx === -1) return prevUnits;
        }

        const originalAssignment = foundSourceLine.assignments.find((a: Assignment) => a.id === assignment.id);
        if (!originalAssignment) return prevUnits;

        const remainingQuantity = originalAssignment.quantity - quantityToMove;
        
        // Update or remove from source line
        if (remainingQuantity > 0) {
            originalAssignment.quantity = remainingQuantity;
        } else {
            foundSourceLine.assignments = foundSourceLine.assignments.filter((a: Assignment) => a.id !== assignment.id);
        }

        const newAssignment: Assignment = {
            ...originalAssignment,
            id: `as-${Date.now()}-${Math.random()}`,
            quantity: quantityToMove,
            startDate: format(newStartDate, 'yyyy-MM-dd'),
            endDate: format(newEndDate, 'yyyy-MM-dd'),
        };
        
        // Add to target line
        foundTargetLine.assignments.push(newAssignment);
        
        return newUnits;
    });

    toast({ title: 'Assignment Moved', description: `Moved ${quantityToMove.toLocaleString()} units of ${assignment.order_num} to ${targetLine.name}.` });
    return { success: true };
};

const handleAutoPlan = (ordersToPlan: { orderId: string, quantity: number }[], dateRange: DateRange) => {
  if (!dateRange.from || !dateRange.to) {
      toast({ variant: 'destructive', title: 'Auto-Plan Error', description: 'A valid date range is required for auto-planning.' });
      return;
  }

  let tempOrders = JSON.parse(JSON.stringify(orders));
  let tempUnits = JSON.parse(JSON.stringify(units));
  
  const planningInterval = { start: startOfDay(dateRange.from), end: startOfDay(dateRange.to) };
  const planningDays = eachDayOfInterval(planningInterval);

  let assignmentsMade = 0;
  let planningSucceeded = true;
  
  for (const { orderId, quantity } of ordersToPlan) {
      const order = tempOrders.find((o: Order) => o.id === orderId);
      if (!order || quantity <= 0) continue;

      let assigned = false;
      
      const allLinesSorted = tempUnits.flatMap((unit: Unit) => unit.lines.map((line: ProductionLine) => {
          const totalCapacityInPeriod = line.dailyCap * planningDays.length;
          let assignedQuantityInPeriod = 0;
          
          for (const day of planningDays) {
              assignedQuantityInPeriod += line.assignments.reduce((sum: number, a: Assignment) => {
                  if (isWithinInterval(day, { start: startOfDay(parseISO(a.startDate)), end: startOfDay(parseISO(a.endDate)) })) {
                      const duration = differenceInDays(startOfDay(parseISO(a.endDate)), startOfDay(parseISO(a.startDate))) + 1;
                      return sum + (a.quantity / duration);
                  }
                  return sum;
              }, 0);
          }
          const utilization = totalCapacityInPeriod > 0 ? (assignedQuantityInPeriod / totalCapacityInPeriod) * 100 : Infinity;
          return { ...line, unitId: unit.id, utilization };
      })).sort((a, b) => a.utilization - b.utilization);

      for (const line of allLinesSorted) {
          if (line.dailyCap <= 0) continue;

          const requiredDays = Math.ceil(quantity / line.dailyCap);
          if (requiredDays <= 0 || requiredDays > planningDays.length) continue; 

          const dailyProductionRate = quantity / requiredDays;

          for (let i = 0; i <= planningDays.length - requiredDays; i++) {
              const slotStart = planningDays[i];
              const slotEnd = addDays(slotStart, requiredDays - 1);
              const slotInterval = { start: slotStart, end: slotEnd };
              
              if (slotEnd > planningInterval.end) continue;

              let slotIsViable = true;
              for (const day of eachDayOfInterval(slotInterval)) {
                  const dayStart = startOfDay(day);
                  const existingLoadOnDay = line.assignments.reduce((sum, existing) => {
                      if (isWithinInterval(dayStart, { start: startOfDay(parseISO(existing.startDate)), end: startOfDay(parseISO(existing.endDate)) })) {
                          const duration = differenceInDays(startOfDay(parseISO(existing.endDate)), startOfDay(parseISO(existing.startDate))) + 1;
                          return sum + (existing.quantity / duration);
                      }
                      return sum;
                  }, 0);
                  
                  if (existingLoadOnDay + dailyProductionRate > line.dailyCap + 0.001) {
                      slotIsViable = false;
                      break;
                  }
              }

              if (slotIsViable) {
                  const newAssignment: Assignment = {
                      id: `as-${Date.now()}-${Math.random()}`,
                      orderId,
                      order_num: order.order_num,
                      quantity,
                      startDate: format(slotStart, 'yyyy-MM-dd'),
                      endDate: format(slotEnd, 'yyyy-MM-dd'),
                      tentative: order.tentative,
                  };
                  
                  // Find the line in tempUnits and add the assignment
                  const unitToUpdate = tempUnits.find(u => u.id === line.unitId);
                  const lineToUpdate = unitToUpdate?.lines.find(l => l.id === line.id);
                  if (lineToUpdate) {
                      lineToUpdate.assignments.push(newAssignment);
                  }

                  const orderIndex = tempOrders.findIndex((o: Order) => o.id === orderId);
                  const currentOrder = tempOrders[orderIndex];
                  const newAssigned = currentOrder.qty.assigned + quantity;
                  currentOrder.qty.assigned = newAssigned;
                    currentOrder.qty.remaining = currentOrder.qty.total - newAssigned;
                  currentOrder.status = currentOrder.qty.remaining > 0 ? 'Partially Assigned' : 'Fully Assigned';

                  assigned = true;
                  assignmentsMade++;
                  break; 
              }
          }
          if (assigned) break;
      }

      if (!assigned) {
          planningSucceeded = false;
          toast({
              variant: 'destructive',
              title: `Planning Failed for ${order.order_num}`,
              description: `Could not find a suitable slot for ${quantity.toLocaleString()} units within the selected dates and capacity limits.`,
          });
      }
  }

  if (assignmentsMade > 0) {
      setOrders(tempOrders);
      setUnits(tempUnits);
      toast({
          title: 'Auto-Plan Complete!',
          description: `Successfully created ${assignmentsMade} new assignment(s).`,
      });
  } else if (planningSucceeded) {
      toast({
          variant: 'destructive',
          title: 'Auto-Plan Warning',
          description: `No assignments could be made for the selected orders.`,
      });
  }
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
      if (filters.etd && format(startOfDay(new Date(order.etd_date)), 'yyyy-MM-dd') !== format(startOfDay(filters.etd), 'yyyy-MM-dd')) return false;
      if (filters.style.length > 0 && !filters.style.includes(order.style)) return false;
      if (filters.status.length > 0 && !filters.status.includes(order.status)) return false;
      if (filters.oc_search && !order.order_num.toLowerCase().includes(filters.oc_search.toLowerCase())) return false;
      if (filters.quantity_min !== '' && order.qty.total < filters.quantity_min) return false;
      if (filters.quantity_max !== '' && order.qty.total > filters.quantity_max) return false;
      if (filters.order_date_from && startOfDay(new Date(order.order_date)) < startOfDay(filters.order_date_from)) return false;
      if (filters.order_date_to && startOfDay(new Date(order.order_date)) > startOfDay(filters.order_date_to)) return false;
      
      return true;
    });
  }, [orders, filters]);
  
  const availableOrders = useMemo(() => {
    return filteredOrders.filter(o => o.qty.remaining > 0).sort((a,b) => new Date(a.etd_date).getTime() - new Date(b.etd_date).getTime());
  }, [filteredOrders]);

  const allAvailableOrders = useMemo(() => {
    return orders.filter(o => o.qty.remaining > 0).sort((a,b) => new Date(a.etd_date).getTime() - new Date(b.etd_date).getTime());
  }, [orders]);

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
          onOpenAutoPlan={() => setAutoPlanModalOpen(true)}
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
          <TimelineSection units={units} selectedMonth={selectedMonth} allLines={allLines} onUnassign={handleUnassignOrder} />
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
            unit={selectedUnit}
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

        {isAutoPlanModalOpen && (
            <AutoPlanModal
                isOpen={isAutoPlanModalOpen}
                onClose={() => setAutoPlanModalOpen(false)}
                orders={allAvailableOrders}
                onAutoPlan={handleAutoPlan}
            />
        )}
      </div>
       <DragOverlay>
        {activeItem ? (
          'qty' in activeItem ? (
            <OrderCard order={activeItem} isDragging />
          ) : (
             <div style={{
                width: `${Math.max(48, (differenceInDays(startOfDay(parseISO(activeItem.endDate)), startOfDay(parseISO(activeItem.startDate))) + 1) * 48)}px`,
                height: '36px'
            }}>
                <TimelineAssignment
                    assignment={activeItem as Assignment & { lineId: string }}
                    isDragging
                    onUnassign={() => {}}
                />
            </div>
          )
        ) : null}
      </DragOverlay>
    </ClientOnlyDndProvider>
  );
}
