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
import { Order } from '@/lib/data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, addDays } from 'date-fns';
import { Wand2, AlertCircle, Calendar as CalendarIcon, ArrowLeft, Loader2, ArrowRight } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

type OrderToPlan = {
  orderId: string;
  orderNum: string;
  customer: string;
  style: string;
  totalQty: number;
  remainingQty: number;
  etd: string;
  quantityToAssign: number;
};

type AutoPlanModalProps = {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onAutoPlan: (orders: {orderId: string, quantity: number}[], dateRange: DateRange) => void;
};

export default function AutoPlanModal({ isOpen, onClose, orders, onAutoPlan }: AutoPlanModalProps) {
  const [step, setStep] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<Record<string, boolean>>({});
  const [ordersToPlan, setOrdersToPlan] = useState<OrderToPlan[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 30),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedOrders({});
      setOrdersToPlan([]);
      setDateRange({ from: new Date(), to: addDays(new Date(), 30) });
      setIsSubmitting(false);
      setError(null);
    }
  }, [isOpen]);

  const handleNextStep = () => {
    if (step === 1) {
      const selected = Object.keys(selectedOrders).filter(id => selectedOrders[id]);
      if (selected.length === 0) {
        setError("Please select at least one order to plan.");
        return;
      }
      const toPlan = orders
        .filter(o => selected.includes(o.id))
        .map(o => ({
          orderId: o.id,
          orderNum: o.order_num,
          customer: o.customer,
          style: o.style,
          totalQty: o.qty.total,
          remainingQty: o.qty.remaining,
          etd: o.etd_date,
          quantityToAssign: o.qty.remaining,
        }));
      setOrdersToPlan(toPlan);
      setError(null);
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    if (step === 2) setStep(1);
  };
  
  const handleQuantityChange = (orderId: string, value: number) => {
    setOrdersToPlan(prev => prev.map(o => o.orderId === orderId ? {...o, quantityToAssign: value} : o));
  };

  const handleSubmit = () => {
    if (!dateRange?.from || !dateRange?.to) {
      setError("Please select a valid date range for planning.");
      return;
    }
    const hasInvalidQuantities = ordersToPlan.some(o => o.quantityToAssign <= 0 || o.quantityToAssign > o.remainingQty);
    if (hasInvalidQuantities) {
        setError("Please ensure all quantities are greater than zero and do not exceed the remaining quantity for each order.");
        return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    const finalPlan = ordersToPlan.map(({orderId, quantityToAssign}) => ({orderId, quantity: quantityToAssign}));
    
    try {
      onAutoPlan(finalPlan, dateRange);
      onClose();
    } catch (e: any) {
        setError(e.message || "An unexpected error occurred.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const totalSelectedOrders = Object.values(selectedOrders).filter(Boolean).length;
  const totalQuantityToAssign = useMemo(() => {
    return ordersToPlan.reduce((sum, order) => sum + order.quantityToAssign, 0);
  }, [ordersToPlan]);
  
  const stepTitles: { [key: number]: string } = {
    1: 'Select Orders for Auto-Planning',
    2: 'Configure Plan & Execute',
  };

  const stepDescriptions: { [key: number]: string } = {
    1: 'Choose which available orders you would like the system to automatically assign to production lines.',
    2: 'Review quantities, select a planning period, and run the auto-planner.',
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wand2 /> {stepTitles[step]}</DialogTitle>
          <DialogDescription>{stepDescriptions[step]}</DialogDescription>
        </DialogHeader>

        {error && (
            <Alert variant="destructive" className="my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {step === 1 && (
            <div className="space-y-4">
                <div className="font-medium text-sm">
                    Selected Orders: <Badge variant="secondary">{totalSelectedOrders}</Badge>
                </div>
                <ScrollArea className="h-96 border rounded-md p-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-1">
                    {orders.map(order => (
                        <div key={order.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-card has-[[data-state=checked]]:bg-muted">
                        <Checkbox
                            id={`order-${order.id}`}
                            checked={selectedOrders[order.id] || false}
                            onCheckedChange={checked => {
                            setSelectedOrders(prev => ({ ...prev, [order.id]: !!checked }));
                            }}
                        />
                        <label htmlFor={`order-${order.id}`} className="flex-1 text-sm space-y-1 cursor-pointer">
                            <p className="font-semibold">{order.order_num} <span className="text-xs text-muted-foreground font-normal">({order.customer})</span></p>
                            <div className="text-xs text-muted-foreground flex justify-between">
                                <span>Remaining: <strong className='text-foreground'>{order.qty.remaining.toLocaleString()}</strong></span>
                                <span>ETD: {format(parseISO(order.etd_date), 'M/d/yy')}</span>
                            </div>
                        </label>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
            </div>
        )}

        {step === 2 && (
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 p-3 border rounded-lg">
                        <Label className="text-base font-semibold">1. Review Quantities</Label>
                        <ScrollArea className="h-80">
                            <div className="space-y-3 pr-4">
                            {ordersToPlan.map(order => (
                                <div key={order.orderId} className="p-2 border rounded-md space-y-2">
                                    <p className="font-semibold text-sm">{order.orderNum}</p>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor={`qty-${order.orderId}`} className="text-xs shrink-0">Assign Qty:</Label>
                                        <Input
                                            id={`qty-${order.orderId}`}
                                            type="number"
                                            value={order.quantityToAssign}
                                            onChange={(e) => handleQuantityChange(order.orderId, parseInt(e.target.value) || 0)}
                                            max={order.remainingQty}
                                            min={0}
                                            className="h-8"
                                        />
                                    </div>
                                     <p className="text-xs text-muted-foreground text-right">Remaining: {order.remainingQty.toLocaleString()}</p>
                                </div>
                            ))}
                            </div>
                        </ScrollArea>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2 p-3 border rounded-lg">
                            <Label className="text-base font-semibold">2. Select Planning Period</Label>
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
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                         <div className="p-3 border rounded-lg space-y-2">
                            <h3 className="font-semibold text-base">Summary</h3>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Orders to Plan:</span>
                                <span className="font-medium">{ordersToPlan.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Quantity:</span>
                                <span className="font-medium">{totalQuantityToAssign.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <DialogFooter className="pt-4 flex justify-between w-full">
          {step === 1 && (
            <div className="w-full flex justify-end">
                <Button onClick={handleNextStep} disabled={totalSelectedOrders === 0}>
                    Next <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
            </div>
          )}
          {step === 2 && (
             <>
                <Button variant="outline" onClick={handlePrevStep} disabled={isSubmitting}>
                    <ArrowLeft className="mr-2 h-4 w-4"/> Back
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting || totalQuantityToAssign <= 0}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Run Auto-Plan
                </Button>
             </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
