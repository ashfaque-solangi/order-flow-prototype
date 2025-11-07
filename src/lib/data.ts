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
  {
    id: 'ord-7',
    order_num: 'OC-1207G',
    qty: { total: 4800, assigned: 0, remaining: 4800 },
    customer: 'Echo Fashion',
    style: 'ST-005',
    order_date: format(subDays(today, 30), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 5), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: false,
  },
  {
    id: 'ord-8',
    order_num: 'OC-1208H',
    qty: { total: 7200, assigned: 0, remaining: 7200 },
    customer: 'Alpha Corp',
    style: 'ST-003',
    order_date: format(subDays(today, 12), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 22), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: false,
  },
  {
    id: 'ord-9',
    order_num: 'OC-1209I',
    qty: { total: 10000, assigned: 0, remaining: 10000 },
    customer: 'Foxtrot Retail',
    style: 'ST-006',
    order_date: format(subDays(today, 8), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 40), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: false,
  },
  {
    id: 'ord-10',
    order_num: 'OC-1210J',
    qty: { total: 950, assigned: 0, remaining: 950 },
    customer: 'Delta LLC',
    style: 'ST-004',
    order_date: format(subDays(today, 18), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 12), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: false,
  },
  {
    id: 'ord-11',
    order_num: 'OC-1211K',
    qty: { total: 2500, assigned: 0, remaining: 2500 },
    customer: 'Planning Dept',
    style: 'ST-001',
    order_date: format(subDays(today, 1), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 35), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: true,
  },
  {
    id: 'ord-12',
    order_num: 'OC-1212L',
    qty: { total: 5300, assigned: 0, remaining: 5300 },
    customer: 'Bravo Inc',
    style: 'ST-007',
    order_date: format(subDays(today, 22), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 28), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: false,
  },
  {
    id: 'ord-13',
    order_num: 'OC-1213M',
    qty: { total: 3300, assigned: 0, remaining: 3300 },
    customer: 'Golf Apparel',
    style: 'ST-008',
    order_date: format(subDays(today, 40), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 14), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: false,
  },
  {
    id: 'ord-14',
    order_num: 'OC-1214N',
    qty: { total: 4100, assigned: 0, remaining: 4100 },
    customer: 'Alpha Corp',
    style: 'ST-001',
    order_date: format(subDays(today, 3), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 19), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: false,
  },
  {
    id: 'ord-15',
    order_num: 'OC-1215O',
    qty: { total: 1800, assigned: 0, remaining: 1800 },
    customer: 'Echo Fashion',
    style: 'ST-005',
    order_date: format(subDays(today, 6), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 23), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: false,
  },
  {
    id: 'ord-16',
    order_num: 'OC-1216P',
    qty: { total: 6700, assigned: 0, remaining: 6700 },
    customer: 'Foxtrot Retail',
    style: 'ST-006',
    order_date: format(subDays(today, 28), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 45), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: false,
  },
  {
    id: 'ord-17',
    order_num: 'OC-1217Q',
    qty: { total: 2000, assigned: 0, remaining: 2000 },
    customer: 'Planning Dept',
    style: 'ST-009',
    order_date: format(subDays(today, 4), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 50), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: true,
  },
  {
    id: 'ord-18',
    order_num: 'OC-1218R',
    qty: { total: 4500, assigned: 0, remaining: 4500 },
    customer: 'Delta LLC',
    style: 'ST-007',
    order_date: format(subDays(today, 11), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 33), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: false,
  },
  {
    id: 'ord-19',
    order_num: 'OC-1219S',
    qty: { total: 3100, assigned: 0, remaining: 3100 },
    customer: 'Golf Apparel',
    style: 'ST-008',
    order_date: format(subDays(today, 14), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 26), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: false,
  },
  {
    id: 'ord-20',
    order_num: 'OC-1220T',
    qty: { total: 1200, assigned: 0, remaining: 1200 },
    customer: 'Bravo Inc',
    style: 'ST-002',
    order_date: format(subDays(today, 9), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 17), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: false,
  },
  {
    id: 'ord-21',
    order_num: 'OC-1221U',
    qty: { total: 9000, assigned: 0, remaining: 9000 },
    customer: 'Alpha Corp',
    style: 'ST-010',
    order_date: format(subDays(today, 2), 'yyyy-MM-dd'),
    etd_date: format(addDays(today, 60), 'yyyy-MM-dd'),
    status: 'Planned',
    tentative: false,
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
  {
    id: 'unit-4',
    name: 'Finishing Unit X',
    lines: [
      { id: 'line-4A', name: 'Finish Line A', dailyCap: 500, assignments: [] },
      { id: 'line-4B', name: 'Finish Line B', dailyCap: 500, assignments: [] },
    ],
  },
  {
    id: 'unit-5',
    name: 'Stitching Unit 3',
    lines: [
      { id: 'line-5A', name: 'Line 3A', dailyCap: 275, assignments: [] },
      { id: 'line-5B', name: 'Line 3B', dailyCap: 275, assignments: [] },
    ],
  },
  {
    id: 'unit-6',
    name: 'Specialty Unit',
    lines: [
      { id: 'line-6A', name: 'Embroidery Line', dailyCap: 150, assignments: [] },
    ],
  },
  {
    id: 'unit-7',
    name: 'Stitching Unit 4',
    lines: [
      { id: 'line-7A', name: 'Line 4A', dailyCap: 320, assignments: [] },
      { id: 'line-7B', name: 'Line 4B', dailyCap: 320, assignments: [] },
      { id: 'line-7C', name: 'Line 4C', dailyCap: 320, assignments: [] },
    ],
  },
  {
    id: 'unit-8',
    name: 'Cutting Unit B',
    lines: [
      { id: 'line-8A', name: 'Cutting Line B', dailyCap: 1200, assignments: [] },
    ],
  },
];
