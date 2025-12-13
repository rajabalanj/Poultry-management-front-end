import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface EggData {
  month: string;
  total_eggs: number;
}

interface EggProductionGraphProps {
  data: EggData[];
  loading: boolean;
  error: string | null;
}

const EggProductionGraph: React.FC<EggProductionGraphProps> = ({ data, loading, error }) => {
  if (loading) {
    return <div className="text-center">Loading graph data...</div>;
  }

  if (error) {
    return <div className="text-center text-danger">{error}</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-center">No data available for the selected period.</div>;
  }

  return (
    <div className="card shadow-sm h-100">
        <div className="card-body">
            <h5 className="card-title d-flex align-items-center">
                <TrendingUp className="me-2" />
                Monthly Egg Production Trend
            </h5>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total_eggs" stroke="#8884d8" activeDot={{ r: 8 }} name="Total Eggs" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};

export default EggProductionGraph;
