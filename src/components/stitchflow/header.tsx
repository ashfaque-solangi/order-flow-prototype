'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarIcon, Filter, RotateCcw, PlusCircle, ChevronsRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Filters } from '@/app/page';

type AppHeaderProps = {
  onReset: () => void;
  onAddTentative: () => void;
  onOpenFilters: () => void;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  uniqueCustomers: string[];
  uniqueOCs: string[];
  availableOrdersCount: number;
};

export default function AppHeader({
  onReset,
  onAddTentative,
  onOpenFilters,
  filters,
  setFilters,
  uniqueCustomers,
  uniqueOCs,
  availableOrdersCount,
}: AppHeaderProps) {
  const handleFilterChange = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <header className="bg-card border-b shadow-sm p-3 sticky top-0 z-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-primary">StitchFlow</h1>
          <Badge variant="secondary" className="hidden sm:flex items-center gap-2">
            Available Orders <span className="font-bold text-primary">{availableOrdersCount}</span>
          </Badge>
          <Separator orientation="vertical" className="h-6 hidden lg:block" />
          <div className="text-sm text-muted-foreground hidden lg:block">
            {format(new Date(), 'eeee, MMMM do, yyyy')}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Select
              value={filters.customer[0] || ''}
              onValueChange={(value) => handleFilterChange('customer', value ? [value] : [])}
            >
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <SelectValue placeholder="All Customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Customers</SelectItem>
                {uniqueCustomers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select
              value={filters.oc[0] || ''}
              onValueChange={(value) => handleFilterChange('oc', value ? [value] : [])}
            >
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="All OC #" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All OC #</SelectItem>
                {uniqueOCs.map(oc => <SelectItem key={oc} value={oc}>{oc}</SelectItem>)}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  size="sm"
                  className={cn(
                    'w-[150px] justify-start text-left font-normal h-9 text-xs',
                    !filters.etd && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.etd ? format(filters.etd, 'PPP') : <span>ETD Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.etd}
                  onSelect={(date) => handleFilterChange('etd', date as Date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="sm" className="h-9" onClick={onOpenFilters}>
              <Filter className="h-4 w-4 mr-2" /> More Filters
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6 mx-2" />

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-9" onClick={onReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Data
            </Button>
            <Button size="sm" className="h-9 bg-accent hover:bg-accent/90" onClick={onAddTentative}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Tentative Order
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
