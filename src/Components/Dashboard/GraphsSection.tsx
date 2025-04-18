import React, { useState, useEffect, useRef } from 'react';
import * as FrappeCharts from 'frappe-charts/dist/frappe-charts.min.esm';
import '../../styles/global.css';
//import { batchApi, Batch } from "../services/api";

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children }) => (
  <div className="card shadow-sm h-100">
    <div className="card-body p-0">
      <h6 className="card-title mb-2 text-sm px-2 pt-2">{title}</h6>
      <div className="chart-container p-0">{children}</div>
    </div>
  </div>
);

const GraphsSection: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const dailyChartRef = useRef<HTMLDivElement>(null);
  const monthlyChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (dailyChartRef.current && monthlyChartRef.current) {
      // Daily Chart
      new FrappeCharts.Chart(dailyChartRef.current, {
        data: {
          labels: ['Today', "Yesterday"],
          datasets: [
            {
              name: 'Eggs Count',
              values: [14000, 14500]
            }
          ]
        },
        type: 'bar',
        height: isMobile ? 150 : 400,
        colors: ['#4CAF50', '#2196F3'],
        barOptions: {
          spaceRatio: isMobile ? 0.2 : 0.5
        },
        axisOptions: {
          xAxisMode: 'tick',
          yAxisMode: 'tick',
          xIsSeries: false
        },
        tooltipOptions: {
          formatTooltipX: (d: string) => d || '',
          formatTooltipY: (d: number) => d ? d.toLocaleString() : '0'
        },
        valuesOverPoints: 1,
        isNavigable: false,
        animate: false,
        maxSlices: 2,
        truncateLegends: true,
        yMarkers: [],
        yRegions: [],
        marginLeft: 30,
        marginRight: 10,
        marginTop: 20,
        marginBottom: 30
      });

      // Monthly Chart
      new FrappeCharts.Chart(monthlyChartRef.current, {
        data: {
          labels: ['Sep', 'Oct'],
          datasets: [
            {
              name: 'Monthly Production',
              values: [240000, 250000]
            }
          ]
        },
        type: 'bar',
        height: isMobile ? 150 : 400,
        colors: ['#4CAF50', '#2196F3'],
        barOptions: {
          spaceRatio: isMobile ? 0.2 : 0.5
        },
        axisOptions: {
          xAxisMode: 'tick',
          yAxisMode: 'tick',
          xIsSeries: false
        },
        tooltipOptions: {
          formatTooltipX: (d: string) => d || '',
          formatTooltipY: (d: number) => d ? d.toLocaleString() : '0'
        },
        valuesOverPoints: 1,
        isNavigable: false,
        animate: false,
        maxSlices: 2,
        truncateLegends: true,
        yMarkers: [],
        yRegions: [],
        marginLeft: 30,
        marginRight: 10,
        marginTop: 20,
        marginBottom: 30
      });
    }
  }, [isMobile]);

  return (
    <div className="row g-2 mb-2">
      <div className="col-6">
        <ChartContainer title="Eggs (Today vs. Yesterday)">
          <div ref={dailyChartRef} style={{ width: '100%' }} />
        </ChartContainer>
      </div>

      <div className="col-6">
        <ChartContainer title="Egg Production">
          <div ref={monthlyChartRef} style={{ width: '100%' }} />
        </ChartContainer>
      </div>
    </div>
  );
};

export default GraphsSection; 