import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign } from 'lucide-react';

interface EggCostData {
  month: string;
  total_eggs: number;
  total_cost: string;
  cost_per_egg: string;
  total_cost_str: string;
  cost_per_egg_str: string;
}

interface EggProductionCostGraphProps {
  data: EggCostData[];
  loading: boolean;
  error: string | null;
}

const EggProductionCostGraph: React.FC<EggProductionCostGraphProps> = ({ data, loading, error }) => {
  if (loading) {
    return <div className="text-center">Loading graph data...</div>;
  }

  if (error) {
    return <div className="text-center text-danger">{error}</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-center">No data available for the selected period.</div>;
  }

  const formatMonth = (dateString: string): string => {
    const [year, month] = dateString.split('-');
    if (!year || !month) return dateString; // Fallback for unexpected format
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const monthName = date.toLocaleString('en-US', { month: 'short' });
    const yearShort = year.slice(-2);
    return `${monthName}-${yearShort}`;
  };

  const formattedData = data.map(item => ({
    ...item,
    month: formatMonth(item.month),
    cost_per_egg: parseFloat(item.cost_per_egg),
    total_cost: parseFloat(item.total_cost),
    cost_per_egg_str: item.cost_per_egg_str,
    total_cost_str: item.total_cost_str,
  }));

  return (
    <div className="card shadow-sm h-100">
        <div className="card-body">
            <h5 className="card-title d-flex align-items-center">
                <DollarSign className="me-2" />
                Monthly Cost Per Egg (₹)
            </h5>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart
                    data={formattedData}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis label={{ value: "Cost Per Egg (₹)", angle: -90, position: "insideLeft" }} />
                    <Tooltip 
                        formatter={(_, name, props) => {
                          return [props.payload.cost_per_egg_str, name];
                        }}
                    />
                    <Legend />
                    <Line 
                        type="monotone" 
                        dataKey="cost_per_egg" 
                        stroke="#82ca9d" 
                        activeDot={{ r: 8 }} 
                        name="Cost Per Egg (₹)" 
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};

export default EggProductionCostGraph;
