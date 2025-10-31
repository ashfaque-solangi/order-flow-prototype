
'use client';

import { useMemo } from 'react';
import { ProductionLine } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LineCapacityChart from '../line-capacity-chart';
import { BarChart } from 'lucide-react';

type TimelineOverviewProps = {
  allLines: (ProductionLine & { unitName: string })[];
};

export default function TimelineOverview({ allLines }: TimelineOverviewProps) {
  const chartData = useMemo(() => {
    const monthlyMultiplier = 30; // Assuming a 30-day month for capacity calculation
    return allLines.map(line => {
      const totalAssigned = line.assignments.reduce((sum, a) => sum + a.quantity, 0);
      const totalCapacity = line.dailyCap * monthlyMultiplier;
      return {
        name: line.name,
        total: totalCapacity,
        assigned: totalAssigned,
      };
    });
  }, [allLines]);

  return (
    <div>
        <h2 className="text-lg font-semibold mb-2 flex items-center"><BarChart className="w-5 h-5 mr-2 text-primary" /> Monthly Capacity Overview</h2>
        <Card>
            <CardHeader>
                <CardTitle>Production Line Utilization</CardTitle>
                <CardDescription>
                    This chart shows the total assigned quantity vs. the total monthly capacity for each production line.
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] w-full">
                <LineCapacityChart data={chartData} />
            </CardContent>
        </Card>
    </div>
  );
}
