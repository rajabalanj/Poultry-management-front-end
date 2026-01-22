import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Utensils } from 'lucide-react';

interface FeedConsumptionData {
  month: string;
  total_eggs: number;
  total_feed_grams: number;
  total_feed_kg: number;
  feed_per_egg_grams: number;
  feed_per_egg_kg: number;
}

interface FeedConsumptionPerEggGraphProps {
  data: FeedConsumptionData[];
  loading: boolean;
  error: string | null;
}

const FeedConsumptionPerEggGraph: React.FC<FeedConsumptionPerEggGraphProps> = ({ data, loading, error }) => {
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
  }));

  return (
    <div className="card shadow-sm h-100">
        <div className="card-body">
            <h5 className="card-title d-flex align-items-center">
                <Utensils className="me-2" />
                Monthly Feed Consumption Per Egg (grams)
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
                    <YAxis label={{ value: "Feed Per Egg (grams)", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="feed_per_egg_grams"
                        stroke="#FF8042"
                        activeDot={{ r: 8 }}
                        name="Feed Per Egg (grams)"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};

export default FeedConsumptionPerEggGraph;
