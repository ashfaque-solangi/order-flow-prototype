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
import { Checkbox } from '@/components/ui/checkbox';
import type { Filters } from '@/app/page';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';


type FiltersModalProps = {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: (filters: Filters | ((prev: Filters) => Filters)) => void;
  uniqueValues: {
    styles: string[];
    statuses: string[];
  };
};

export default function FiltersModal({ isOpen, onClose, filters, setFilters, uniqueValues }: FiltersModalProps) {
  const handleMultiSelectChange = (key: 'style' | 'status', value: string) => {
    setFilters(prev => {
      const newValues = prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value];
      return { ...prev, [key]: newValues };
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setFilters(prev => ({
        ...prev,
        order_date_from: range?.from,
        order_date_to: range?.to,
    }))
  };

  const clearFilters = () => {
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
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>More Filters</DialogTitle>
          <DialogDescription>Apply advanced filters to find specific orders.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
          <div className="space-y-4">
            <h4 className="font-semibold">By Details</h4>
            <div className="space-y-2">
              <Label htmlFor="oc_search">OC Number Contains</Label>
              <Input
                id="oc_search"
                name="oc_search"
                placeholder="Search OC..."
                value={filters.oc_search}
                onChange={(e) => setFilters(prev => ({...prev, oc_search: e.target.value}))}
              />
            </div>
             <div className="space-y-2">
              <Label>Quantity Range</Label>
              <div className="flex gap-2">
                <Input
                  name="quantity_min"
                  type="number"
                  placeholder="Min"
                  value={filters.quantity_min}
                  onChange={handleInputChange}
                />
                <Input
                  name="quantity_max"
                  type="number"
                  placeholder="Max"
                  value={filters.quantity_max}
                  onChange={handleInputChange}
                />
              </div>
            </div>
             <div className="space-y-2">
                <Label>Order Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        id="date"
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !filters.order_date_from && "text-muted-foreground")}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.order_date_from ? (
                            filters.order_date_to ? (
                            <>
                                {format(filters.order_date_from, "LLL dd, y")} - {format(filters.order_date_to, "LLL dd, y")}
                            </>
                            ) : (
                            format(filters.order_date_from, "LLL dd, y")
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
                        defaultMonth={filters.order_date_from}
                        selected={{ from: filters.order_date_from, to: filters.order_date_to }}
                        onSelect={handleDateRangeChange}
                        numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold">By Style</h4>
            <ScrollArea className="h-48 rounded-md border p-2">
              <div className="space-y-2">
                {uniqueValues.styles.map(style => (
                  <div key={style} className="flex items-center space-x-2">
                    <Checkbox
                      id={`style-${style}`}
                      checked={filters.style.includes(style)}
                      onCheckedChange={() => handleMultiSelectChange('style', style)}
                    />
                    <label htmlFor={`style-${style}`} className="text-sm font-medium leading-none">
                      {style}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold">By Status</h4>
            <ScrollArea className="h-48 rounded-md border p-2">
              <div className="space-y-2">
                {uniqueValues.statuses.map(status => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.status.includes(status)}
                      onCheckedChange={() => handleMultiSelectChange('status', status)}
                    />
                    <label htmlFor={`status-${status}`} className="text-sm font-medium leading-none">
                      {status}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={clearFilters}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All Filters
          </Button>
          <Button onClick={onClose}>Apply & Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
