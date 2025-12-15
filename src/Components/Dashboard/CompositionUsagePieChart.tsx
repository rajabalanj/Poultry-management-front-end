import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

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

  // Re-structure data for recharts compatibility and custom labeling
  const chartData = data.map(item => ({
    name: item.composition_name,
    value: item.total_usage,
    unit: item.unit,
  }));

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
              outerRadius={100}
              fill="#8884d8"
              label={({ payload }) => `${payload.value} ${payload.unit}`}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number, name: string, props: any) => [`${value} ${props.payload.unit || ''}`, name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CompositionUsagePieChart;
