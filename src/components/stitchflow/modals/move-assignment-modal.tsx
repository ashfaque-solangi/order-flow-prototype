
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
import { Assignment, ProductionLine } from '@/lib/data';
import { DateRange } from 'react-day-picker';
import { addDays, format, differenceInDays, parseISO, isWithinInterval } from 'date-fns';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import CapacityBar from '../capacity-bar';

type AssignmentState = {
    assignment: Assignment;
    sourceLineId: string;
    targetLineId: string;
    newStartDate: Date;
};

type MoveAssignmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  assignmentState: AssignmentState;
  onMove: (
    assignment: Assignment,
    sourceLineId: string,
    targetLineId: string,
    newStartDate: Date,
    quantityToMove: number
  ) => { success: boolean, message?: string };
  allLines: (ProductionLine & {unitName: string})[];
};

export default function MoveAssignmentModal({ isOpen, onClose, assignmentState, onMove, allLines }: MoveAssignmentModalProps) {
  const { assignment, sourceLineId, targetLineId, newStartDate } = assignmentState;
  
  const [quantity, setQuantity] = useState(assignment.quantity);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuantity(assignment.quantity);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, assignment.quantity]);

  const sourceLine = allLines.find(l => l.id === sourceLineId);
  const targetLine = allLines.find(l => l.id === targetLineId);

  const duration = differenceInDays(parseISO(assignment.endDate), parseISO(assignment.startDate)) + 1;
  const newEndDate = addDays(newStartDate, duration - 1);

  const { availableCapacity, targetLineCapacity, targetLineAssigned } = useMemo(() => {
    if (!targetLine) return { availableCapacity: 0, targetLineCapacity: 0, targetLineAssigned: 0 };

    const totalCapacity = targetLine.dailyCap * duration;
    
    const assignedDuringDrop = targetLine.assignments
        .filter(a => a.id !== assignment.id)
        .reduce((sum, a) => {
        const aStart = parseISO(a.startDate);
        const aEnd = parseISO(a.endDate);
        if(isWithinInterval(newStartDate, {start: aStart, end: aEnd}) || isWithinInterval(newEndDate, {start: aStart, end: aEnd})) {
            const assignmentDuration = differenceInDays(aEnd, aStart) + 1;
            return sum + (a.quantity / assignmentDuration) * Math.min(duration, assignmentDuration);
        }
        return sum;
    }, 0);

    return { 
        availableCapacity: totalCapacity - assignedDuringDrop,
        targetLineCapacity: totalCapacity,
        targetLineAssigned: assignedDuringDrop
    };
  }, [targetLine, newStartDate, newEndDate, duration, assignment.id]);
  

  const handleSubmit = () => {
    if (quantity <= 0) {
      setError('Quantity to move must be greater than zero.');
      return;
    }
    if (quantity > assignment.quantity) {
      setError(`Cannot move more than the assigned quantity of ${assignment.quantity.toLocaleString()}.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = onMove(assignment, sourceLineId, targetLineId, newStartDate, quantity);

    if (result.success) {
      onClose();
    } else {
      setError(result.message || 'An unknown error occurred during the move.');
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Move Assignment: {assignment.order_num}</DialogTitle>
          <DialogDescription>Confirm the details for moving this assignment.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Move Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <Label className="text-muted-foreground">From Line</Label>
              <p className="font-semibold">{sourceLine?.name}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">To Line</Label>
              <p className="font-semibold">{targetLine?.name}</p>
            </div>
             <div className="space-y-1">
              <Label className="text-muted-foreground">Original Dates</Label>
              <p className="font-semibold">{assignment.startDate} to {assignment.endDate}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">New Dates</Label>
              <p className="font-semibold">{format(newStartDate, 'yyyy-MM-dd')} to {format(newEndDate, 'yyyy-MM-dd')}</p>
            </div>
          </div>
        
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-base font-semibold">Quantity to Move</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              max={assignment.quantity}
              min="1"
              disabled={isSubmitting}
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground">
                Maximum movable quantity: {assignment.quantity.toLocaleString()}
            </p>
          </div>

           {targetLine && 
            <div className="space-y-2 p-3 border rounded-lg">
                <Label>Target Line Capacity for this period ({duration} days)</Label>
                <CapacityBar total={targetLineCapacity} used={targetLineAssigned + quantity} />
                <div className="text-xs text-muted-foreground">
                    Available: {Math.max(0, availableCapacity - quantity).toLocaleString()} / Required: {quantity.toLocaleString()}
                </div>
            </div>
            }

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || quantity <= 0}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    