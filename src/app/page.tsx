
'use client';

import { useState, useMemo } from 'react';
import { initialOrders, initialUnits, Order, Unit } from '@/lib/data';
import AppHeader from '@/components/stitchflow/header';
import OrdersSection from '@/components/stitchflow/orders-section';
import UnitsSection from '@/components/stitchflow/units-section';
import TimelineSection from '@/components/stitchflow/timeline-section';
import AssignOrderModal from '@/components/stitchflow/modals/assign-order-modal';
import TentativeOrderModal from '@/components/stitchflow/modals/tentative-order-modal';
import FiltersModal from '@/components/stitchflow/modals/filters-modal';
import { useToast } from '@/hooks/use-toast';
import { validateCapacity } from '@/ai/flows/capacity-validation';
import { format } from 'date-fns';
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { ProductionLine, Assignment } from '@/lib/data';
import { ClientOnlyDndProvider } from '@/components/stitchflow/dnd-provider';

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
  const [isTentativeModalOpen, setTentativeModalOpen] = useState(false);
  const [isFiltersModalOpen, setFiltersModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

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
    const order = orders.find(o => o.id === event.active.id);
    if (order) {
      setActiveOrder(order);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveOrder(null);
    const { active, over } = event;

    if (over && over.data.current?.type === 'unit') {
      const orderId = active.id as string;
      const unitId = over.id as string;
      handleOpenAssignModal(orderId, unitId);
    }
  };


  const handleAssignOrder = async (
    orderId: string,
    lineId: string,
    quantity: number,
    dates: { from: Date; to: Date }
  ): Promise<{ success: boolean; message?: string }> => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found' };

    let targetUnit: Unit | undefined;
    let targetLine: ProductionLine | undefined;

    for (const unit of units) {
      const line = unit.lines.find((l) => l.id === lineId);
      if (line) {
        targetUnit = unit;
        targetLine = line;
        break;
      }
    }

    if (!targetUnit || !targetLine) return { success: false, message: 'Production line not found' };
    
    const assignedCapacity = targetLine.assignments.reduce((sum, a) => sum + a.quantity, 0);

    const validationInput = {
      orderId,
      unitId: targetUnit.id,
      quantity,
      etdDate: order.etd_date,
      dailyCap: targetLine.dailyCap,
      assignedCapacity,
    };
    
    try {
      const validationResult = await validateCapacity(validationInput);

      if (validationResult.isValid) {
        const newAssignment: Assignment = {
          id: `as-${Date.now()}`,
          orderId,
          order_num: order.order_num,
          quantity,
          startDate: format(dates.from, 'yyyy-MM-dd'),
          endDate: format(dates.to, 'yyyy-MM-dd'),
        };

        setUnits(prevUnits =>
          prevUnits.map(u =>
            u.id === targetUnit!.id
              ? {
                  ...u,
                  lines: u.lines.map(l =>
                    l.id === lineId ? { ...l, assignments: [...l.assignments, newAssignment] } : l
                  ),
                }
              : u
          )
        );

        setOrders(prevOrders =>
          prevOrders.map(o =>
            o.id === orderId
              ? {
                  ...o,
                  qty: {
                    total: o.qty.total,
                    assigned: o.qty.assigned + quantity,
                    remaining: o.qty.remaining - quantity,
                  },
                  status: o.qty.remaining - quantity > 0 ? 'Partially Assigned' : 'Fully Assigned',
                }
              : o
          )
        );

        toast({
          title: 'Success!',
          description: `Order ${order.order_num} assigned successfully.`,
        });
        return { success: true };
      } else {
        toast({
          variant: 'destructive',
          title: 'Capacity Validation Failed',
          description: validationResult.reason,
        });
        return { success: false, message: validationResult.reason };
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
    };
    setOrders(prev => [newOrder, ...prev]);
    toast({
      title: 'Tentative Order Created',
      description: `Order ${newOrder.order_num} has been added to the list.`,
    });
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
    return units.find(u => u.id === selectedUnitId) || null;
  }, [selectedUnitId, units]);
  
  const allLines = useMemo(() => units.flatMap(u => u.lines), [units]);

  return (
    <ClientOnlyDndProvider
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      activeOrder={activeOrder}
    >
      <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
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
        <main className="flex-1 flex flex-col gap-6 p-4 lg:p-6">
          <OrdersSection orders={availableOrders} onAssign={handleOpenAssignModal} />
          <UnitsSection units={units} onUnassign={handleUnassignOrder} />
          <TimelineSection units={units} selectedMonth={selectedMonth} />
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
            units={units}
            onAssign={handleAssignOrder}
            preselectedUnitId={selectedUnitId}
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
    </ClientOnlyDndProvider>
  );
}

    