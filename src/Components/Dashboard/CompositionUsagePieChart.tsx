import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface CompositionUsageData {
  composition_name: string;
  total_usage: number;
  unit: string;
}

interface CompositionUsagePieChartProps {
  data: CompositionUsageData[];
  loading: boolean;
  error: string | null;
}

// Interface for the data structure used by the Pie component
interface ChartDataItem {
  name: string;
  value: number;
  unit: string;
  originalItems?: string; // Optional property for the "Others" slice tooltip
  [key: string]: any;      // Index signature for recharts compatibility
}

const COLORS = [
  // Primary High-Contrast Group
  '#2563EB', '#DC2626', '#059669', '#D97706', '#7C3AED', 
  '#DB2777', '#0891B2', '#4F46E5', '#EA580C', '#16A34A',
  
  // Secondary Sophisticated Group
  '#58508d', '#bc5090', '#ff6361', '#ffa600', '#003f5c',
  '#334155', '#701a75', '#047857', '#b91c1c', '#4338ca',

  // Tertiary Light/Pastel Group (to fill to 30)
  '#93C5FD', '#FCA5A5', '#86EFAC', '#FDE047', '#C4B5FD',
  '#F9A8D4', '#67E8F9', '#A5B4FC', '#FDBA74', '#94A3B8'
];

const CompositionUsagePieChart: React.FC<CompositionUsagePieChartProps> = ({ data, loading, error }) => {
  if (loading) {
    return <div className="text-center">Loading chart data...</div>;
  }

  if (error) {
    return <div className="text-center text-danger">{error}</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-center">No composition usage data available.</div>;
  }

  // --- New Logic to Consolidate Small Slices ---
  const totalUsage = data.reduce((acc, item) => acc + item.total_usage, 0);
  const consolidationThreshold = 0.03; // Group slices smaller than 3%

  const mainSlices: ChartDataItem[] = [];
  const otherSlices: CompositionUsageData[] = [];

  for (const item of data) {
    if (totalUsage > 0 && item.total_usage / totalUsage < consolidationThreshold) {
      otherSlices.push(item);
    } else {
      mainSlices.push({
        name: item.composition_name,
        value: item.total_usage,
        unit: item.unit,
      });
    }
  }

  let chartData: ChartDataItem[] = mainSlices;

  if (otherSlices.length > 0) {
    const othersTotal = otherSlices.reduce((acc, item) => acc + item.total_usage, 0);
    // Assuming all items have the same unit, we take it from the first item.
    const unit = data.length > 0 ? data[0].unit : ''; 
    chartData.push({
      name: 'Others',
      value: othersTotal,
      unit: unit,
      // Store original items for tooltip formatting
      originalItems: otherSlices.map(s => `${s.composition_name}: ${s.total_usage}${s.unit}`).join('\n'),
    });
  }

  return (
    <div className="card shadow-sm h-100">
      <div className="card-body">
        <h5 className="card-title d-flex align-items-center">
          <PieChartIcon className="me-2" />
          Composition Usage
        </h5>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100} // Increased radius for better spacing
              fill="#8884d8"
              label={({ name }) => name}
              labelLine={true}
              minAngle={5}
              isAnimationActive={true}
              animationBegin={0}
              animationDuration={400}
            >
              {chartData.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke="#ffffff"
                  strokeWidth={1}
                  style={{
                    filter: 'brightness(1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string, props: any) => {
                // Custom formatter for the "Others" slice tooltip
                if (name === 'Others' && props.payload.originalItems) {
                  const formattedValue = `${value} ${props.payload.unit || ''}`;
                  // The "name" becomes the detailed breakdown
                  return [formattedValue, props.payload.originalItems];
                }
                // Default formatter for other slices
                return [`${value} ${props.payload.unit || ''}`, name];
              }}
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CompositionUsagePieChart;
