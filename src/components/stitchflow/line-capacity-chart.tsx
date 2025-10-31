
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const assigned = payload[0].value;
    const total = payload[1].value;
    const utilization = total > 0 ? Math.round((assigned / total) * 100) : 0;
    return (
      <div className="p-2 bg-background border rounded-md shadow-lg text-sm">
        <p className="font-bold">{label}</p>
        <p className="text-blue-500">Assigned: {assigned.toLocaleString()}</p>
        <p className="text-gray-400">Capacity: {(total).toLocaleString()}</p>
        <p className="font-medium">Utilization: {utilization}%</p>
      </div>
    );
  }

  return null;
};


export default function LineCapacityChart({ data }: { data: { name: string, total: number, assigned: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 20,
          left: 10,
          bottom: 5,
        }}
        barGap={10}
        barCategoryGap="20%"
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }} 
            tickLine={false} 
            axisLine={false}
        />
        <YAxis 
            tick={{ fontSize: 12 }} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value as number)}
        />
        <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--muted))'}}/>
        <Legend wrapperStyle={{fontSize: "12px"}}/>
        <Bar dataKey="assigned" name="Assigned" stackId="a" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="total" name="Total Capacity" stackId="a" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} 
          formatter={(value, name, props) => {
            const { payload, dataKey } = props;
            const assigned = payload.assigned || 0;
            return value - assigned;
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
