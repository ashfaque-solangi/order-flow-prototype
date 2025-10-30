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
import { DateRange } from 'react-day-picker';
import { addDays, format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import CapacityBar from '../capacity-bar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

type AssignOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  units: Unit[];
  onAssign: (
    orderId: string,
    lineId: string,
    quantity: number,
    dates: { from: Date; to: Date }
  ) => Promise<{ success: boolean; message?: string }>;
};

export default function AssignOrderModal({ isOpen, onClose, order, units, onAssign }: AssignOrderModalProps) {
  const [selectedLineId, setSelectedLineId] = useState<string>('');
  const [quantity, setQuantity] = useState<number | string>(order.qty.remaining);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 1),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-calculate quantity when date range or line changes
    if (selectedLine && dateRange?.from && dateRange?.to) {
      const days = differenceInDays(dateRange.to, dateRange.from) + 1;
      const potentialQty = days * selectedLine.dailyCap;
      setQuantity(Math.min(potentialQty, order.qty.remaining));
    }
  }, [dateRange, selectedLineId, order.qty.remaining]);
  
  const allLines = useMemo(() => units.flatMap(u => u.lines.map(l => ({ ...l, unitName: u.name }))), [units]);
  
  const selectedLine = useMemo(() => {
    return allLines.find(l => l.id === selectedLineId);
  }, [selectedLineId, allLines]);
  
  const lineCapacity = useMemo(() => {
    if (!selectedLine) return { total: 0, assigned: 0 };
    const total = selectedLine.dailyCap * 30; // Approx monthly capacity
    const assigned = selectedLine.assignments.reduce((acc, a) => acc + a.quantity, 0);
    return { total, assigned };
  }, [selectedLine]);

  const handleSubmit = async () => {
    if (!selectedLineId || !quantity || !dateRange?.from || !dateRange?.to) {
      setError('Please fill all fields: select a line, set a quantity, and choose a date range.');
      return;
    }
    const numQuantity = Number(quantity);
    if (numQuantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }
    if (numQuantity > order.qty.remaining) {
      setError(`Quantity cannot exceed remaining ${order.qty.remaining}.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await onAssign(order.id, selectedLineId, numQuantity, dateRange as { from: Date, to: Date });

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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Order: {order.order_num}</DialogTitle>
          <DialogDescription>Assign this order to a production line. Remaining Qty: {order.qty.remaining.toLocaleString()}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Assignment Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="line">Production Line</Label>
            <Select value={selectedLineId} onValueChange={setSelectedLineId}>
              <SelectTrigger id="line">
                <SelectValue placeholder="Select a line" />
              </SelectTrigger>
              <SelectContent>
                {units.map(unit => (
                  <div key={unit.id}>
                    <p className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">{unit.name}</p>
                    {unit.lines.map(line => (
                      <SelectItem key={line.id} value={line.id}>{line.name}</SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedLine && (
            <div>
              <Label>Line Capacity (Monthly)</Label>
              <CapacityBar total={lineCapacity.total} used={lineCapacity.assigned} />
            </div>
          )}
          <div className="space-y-2">
            <Label>Production Dates</Label>
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
                    <span>Pick a date</span>
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
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input 
                id="quantity" 
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                max={order.qty.remaining}
                placeholder="Enter quantity"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
