'use client';

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
import { useForm, SubmitHandler } from 'react-hook-form';
import { format } from 'date-fns';

type TentativeOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddOrder: (newOrder: Omit<Order, 'id' | 'qty' | 'status'> & { qty: number }) => void;
};

type FormValues = {
  order_num: string;
  customer: string;
  style: string;
  qty: number;
  etd_date: string;
};

export default function TentativeOrderModal({ isOpen, onClose, onAddOrder }: TentativeOrderModalProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    defaultValues: {
      customer: "Planning Dept",
      etd_date: format(new Date(), 'yyyy-MM-dd')
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  }

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    onAddOrder({
      ...data,
      order_date: format(new Date(), 'yyyy-MM-dd'),
      tentative: true,
    });
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Tentative Order</DialogTitle>
          <DialogDescription>Create a placeholder order for capacity planning.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="order_num">Order Number</Label>
            <Input
              id="order_num"
              {...register('order_num', { required: 'Order Number is required' })}
              placeholder="e.g., OC-TENT-001"
            />
            {errors.order_num && <p className="text-sm text-destructive">{errors.order_num.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Input
                id="customer"
                {...register('customer', { required: 'Customer is required' })}
                placeholder="e.g., Planning Dept"
                />
                {errors.customer && <p className="text-sm text-destructive">{errors.customer.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="style">Style</Label>
                <Input
                id="style"
                {...register('style', { required: 'Style is required' })}
                placeholder="e.g., T-SHIRT-A"
                />
                {errors.style && <p className="text-sm text-destructive">{errors.style.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="qty">Quantity</Label>
                <Input
                id="qty"
                type="number"
                {...register('qty', { required: 'Quantity is required', valueAsNumber: true, min: { value: 1, message: 'Must be at least 1'} })}
                placeholder="e.g., 5000"
                />
                {errors.qty && <p className="text-sm text-destructive">{errors.qty.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="etd_date">ETD Date</Label>
                <Input
                id="etd_date"
                type="date"
                {...register('etd_date', { required: 'ETD Date is required' })}
                />
                {errors.etd_date && <p className="text-sm text-destructive">{errors.etd_date.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={handleClose}>Cancel</Button>
            <Button type="submit">Create Order</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
