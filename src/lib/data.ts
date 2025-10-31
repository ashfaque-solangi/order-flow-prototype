import { addDays, format, subDays } from 'date-fns';

export interface Order {
  id: string;
  order_num: string;
  qty: {
    total: number;
    assigned: number;
    remaining: number;
  };
  customer: string;
  style: string;
  order_date: string; // YYYY-MM-DD
  etd_date: string; // YYYY-MM-DD
  status: 'Planned' | 'Partially Assigned' | 'Fully Assigned';
  tentative: boolean;
}

export interface Assignment {
  id: string;
  orderId: string;
  order_num: string;
  quantity: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  tentative?: boolean;
}

export interface ProductionLine {
  id: string;
  name: string;
  dailyCap: number;
  assignments: Assignment[];
}

export interface Unit {
  id: string;
  name: string;
  lines: ProductionLine[];
}

const today = new Date();

export const initialOrders: Order[] = [
  {
    id: 'ord-1',
    order_num: 'OC-1201A',
    qty: { total: 5000, assigned: 0, remaining: 5000 },
    customer: 'Alpha Corp',
    style: 'ST-001',
    order_date: format(subDays(today, 20), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 10), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: false,
  },
  {
    id: 'ord-2',
    order_num: 'OC-1202B',
    qty: { total: 3500, assigned: 0, remaining: 3500 },
    customer: 'Bravo Inc',
    style: 'ST-002',
    order_date: format(subDays(today, 15), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 15), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: false,
  },
  {
    id: 'ord-3',
    order_num: 'OC-1203C',
    qty: { total: 8000, assigned: 0, remaining: 8000 },
    customer: 'Planning Dept',
    style: 'ST-003',
    order_date: format(subDays(today, 10), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 20), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: true,
  },
  {
    id: 'ord-4',
    order_num: 'OC-1204D',
    qty: { total: 2200, assigned: 0, remaining: 2200 },
    customer: 'Alpha Corp',
    style: 'ST-001',
    order_date: format(subDays(today, 5), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 25), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: false,
  },
    {
    id: 'ord-5',
    order_num: 'OC-1205E',
    qty: { total: 6000, assigned: 0, remaining: 6000 },
    customer: 'Delta LLC',
    style: 'ST-004',
    order_date: format(subDays(today, 25), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 30), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: false,
  },
    {
    id: 'ord-6',
    order_num: 'OC-1206F',
    qty: { total: 1500, assigned: 0, remaining: 1500 },
    customer: 'Bravo Inc',
    style: 'ST-002',
    order_date: format(subDays(today, 2), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 18), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: true,
  },
];

export const initialUnits: Unit[] = [
  {
    id: 'unit-1',
    name: 'Stitching Unit 1',
    lines: [
      { id: 'line-1A', name: 'Line 1A', dailyCap: 250, assignments: [] },
      { id: 'line-1B', name: 'Line 1B', dailyCap: 300, assignments: [] },
      { id: 'line-1C', name: 'Line 1C', dailyCap: 200, assignments: [] },
    ],
  },
  {
    id: 'unit-2',
    name: 'Stitching Unit 2',
    lines: [
      { id: 'line-2A', name: 'Line 2A', dailyCap: 400, assignments: [] },
      { id: 'line-2B', name: 'Line 2B', dailyCap: 350, assignments: [] },
    ],
  },
  {
    id: 'unit-3',
    name: 'Cutting Unit A',
    lines: [
      { id: 'line-3A', name: 'Cutting Line A', dailyCap: 1000, assignments: [] },
    ],
  },
];
