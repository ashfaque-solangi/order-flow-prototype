
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Order, Unit, ProductionLine } from '@/lib/data';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DateRange } from 'react-day-picker';
import { addDays, format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import CapacityBar from '../capacity-bar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Calendar as CalendarIcon, AlertCircle, PlusCircle, Trash2 } from 'lucide-react';

type AssignmentRow = {
  id: string; // temporary id for react key
  lineId: string;
  quantity: number;
};

type AssignOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  unit: Unit;
  onAssign: (
    orderId: string,
    assignments: { lineId: string; quantity: number }[],
    dates: { from: Date; to: Date }
  ) => Promise<{ success: boolean; message?: string }>;
};

export default function AssignOrderModal({ isOpen, onClose, order, unit, onAssign }: AssignOrderModalProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 1),
  });
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Reset state when modal opens
    setDateRange({ from: new Date(), to: addDays(new Date(), 1) });
    setAssignments([]);
    setError(null);
    setIsSubmitting(false);
  }, [isOpen]);

  const productionDays = useMemo(() => {
    if (!dateRange?.from) return 0;
    const toDate = dateRange.to || dateRange.from;
    return differenceInDays(toDate, dateRange.from) + 1;
  }, [dateRange]);

  const handleAddLine = () => {
    const availableLines = unit.lines.filter(l => !assignments.some(a => a.lineId === l.id));
    if (availableLines.length > 0) {
      const firstAvailableLine = availableLines[0];
      const newAssignment: AssignmentRow = {
        id: `temp-${Date.now()}`,
        lineId: firstAvailableLine.id,
        quantity: 0
      };
      setAssignments(prev => [...prev, newAssignment]);
    }
  };

  const handleRemoveLine = (tempId: string) => {
    setAssignments(prev => prev.filter(a => a.id !== tempId));
  };
  
  const handleLineChange = (tempId: string, newLineId: string) => {
    setAssignments(prev => prev.map(a => a.id === tempId ? { ...a, lineId: newLineId } : a));
  };

  const handleQuantityChange = (tempId: string, newQuantity: number) => {
    setAssignments(prev => prev.map(a => a.id === tempId ? { ...a, quantity: newQuantity } : a));
  };
  
  // Auto-calculate quantity when dependencies change
  useEffect(() => {
    setAssignments(prevAssignments => {
      return prevAssignments.map(assignment => {
        const line = unit.lines.find(l => l.id === assignment.lineId);
        if (line && productionDays > 0) {
          const potentialQty = productionDays * line.dailyCap;
          // You might want a more sophisticated logic for distributing remaining qty
          return { ...assignment, quantity: potentialQty };
        }
        return assignment;
      });
    });
  }, [dateRange, unit.lines, productionDays]);


  const totalAssignedQuantity = useMemo(() => {
    return assignments.reduce((sum, a) => sum + Number(a.quantity || 0), 0);
  }, [assignments]);

  const remainingQuantityForOrder = order.qty.remaining - totalAssignedQuantity;

  const handleSubmit = async () => {
    const fromDate = dateRange?.from;
    const toDate = dateRange?.to || dateRange?.from;

    if (!fromDate || !toDate) {
      setError('Please select a production date range.');
      return;
    }
    if (assignments.length === 0) {
      setError('Please add at least one production line.');
      return;
    }
    if (totalAssignedQuantity > order.qty.remaining) {
      setError(`Total assigned quantity (${totalAssignedQuantity}) exceeds the order's remaining quantity (${order.qty.remaining}).`);
      return;
    }
    if (assignments.some(a => !a.lineId || a.quantity <= 0)) {
        setError('Please ensure every line has a selected line and a quantity greater than zero.');
        return;
    }

    setIsSubmitting(true);
    setError(null);

    const finalAssignments = assignments.map(({ lineId, quantity }) => ({ lineId, quantity }));
    const result = await onAssign(order.id, finalAssignments, { from: fromDate, to: toDate });

    if (result.success) {
      onClose();
    } else {
      setError(result.message || 'An unknown error occurred.');
    }
    setIsSubmitting(false);
  };
  
  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };
  
  const availableLinesForDropdown = unit.lines.filter(l => !assignments.some(a => a.lineId === l.id));


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Assign Order: {order.order_num} to {unit.name}</DialogTitle>
          <DialogDescription>Select dates and add production lines to assign quantities. Remaining Qty: {order.qty.remaining.toLocaleString()}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 p-1 pr-6">
            {error && (
              <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Assignment Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Date Selection */}
            <div className="space-y-2 p-4 border rounded-lg">
                <Label className="text-base font-semibold">1. Select Production Dates</Label>
                <Popover>
                <PopoverTrigger asChild>
                    <Button
                    id="date"
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                        dateRange.to ? (
                        <>
                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                        ) : (
                        format(dateRange.from, "LLL dd, y")
                        )
                    ) : (
                        <span>Pick a date range</span>
                    )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    disabled={isSubmitting}
                    />
                </PopoverContent>
                </Popover>
            </div>
            
            {/* Step 2: Line Assignments */}
            <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold">2. Assign to Production Lines</Label>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleAddLine} 
                        disabled={availableLinesForDropdown.length === 0 || !dateRange?.from}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Line
                    </Button>
                </div>
                
                {assignments.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-6">
                        {dateRange?.from ? "Click 'Add Line' to start assigning." : "Please select a date range first."}
                    </div>
                )}
                
                <div className="space-y-4">
                  {assignments.map((assignment, index) => {
                    const selectedLine = unit.lines.find(l => l.id === assignment.lineId);
                    const lineCapacity = selectedLine ? selectedLine.dailyCap * 30 : 0;
                    const assignedCapacity = selectedLine ? selectedLine.assignments.reduce((acc, a) => acc + a.quantity, 0) : 0;

                    return (
                      <div key={assignment.id} className="grid grid-cols-12 gap-3 items-end p-3 border rounded-md relative">
                          <div className="col-span-12">
                               <Separator />
                          </div>
                          <div className="col-span-4 space-y-1.5">
                            <Label htmlFor={`line-${index}`}>Line</Label>
                             <Select 
                                value={assignment.lineId}
                                onValueChange={(newLineId) => handleLineChange(assignment.id, newLineId)}
                            >
                                <SelectTrigger id={`line-${index}`}>
                                    <SelectValue placeholder="Select a line" />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedLine && <SelectItem value={selectedLine.id}>{selectedLine.name}</SelectItem>}
                                    {availableLinesForDropdown.map(line => (
                                        <SelectItem key={line.id} value={line.id}>{line.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-3 space-y-1.5">
                            <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                            <Input
                              id={`quantity-${index}`}
                              type="number"
                              value={assignment.quantity}
                              onChange={e => handleQuantityChange(assignment.id, Number(e.target.value))}
                              max={order.qty.remaining}
                              placeholder="0"
                            />
                          </div>
                           <div className="col-span-4 space-y-1.5">
                                <Label>Line Capacity (Monthly)</Label>
                                {selectedLine && <CapacityBar total={lineCapacity} used={assignedCapacity} />}
                           </div>

                          <div className="col-span-1">
                             <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveLine(assignment.id)}>
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                          </div>
                      </div>
                    )
                  })}
                </div>
            </div>

            {/* Summary */}
             {assignments.length > 0 && (
                <div className="p-4 border rounded-lg space-y-2">
                    <h3 className="font-semibold">Summary</h3>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total to Assign:</span>
                        <span className="font-medium">{totalAssignedQuantity.toLocaleString()}</span>
                    </div>
                    <div className={cn("flex justify-between text-sm", remainingQuantityForOrder < 0 ? "text-destructive" : "text-primary")}>
                        <span className="text-muted-foreground">Order Qty Remaining:</span>
                        <span className="font-bold">{remainingQuantityForOrder.toLocaleString()}</span>
                    </div>
                </div>
            )}

          </div>
        </ScrollArea>
        <DialogFooter className='pt-4 pr-6'>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || assignments.length === 0 || totalAssignedQuantity <= 0}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
