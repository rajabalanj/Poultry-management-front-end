import React, { useState, useEffect, useRef } from 'react';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import '../../styles/global.css';

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

  const dailyChartRef = useRef<HTMLCanvasElement>(null);
  const monthlyChartRef = useRef<HTMLCanvasElement>(null);

  // ✅ Chart instances (persisted between renders)
  const dailyChartInstanceRef = useRef<Chart | null>(null);
  const monthlyChartInstanceRef = useRef<Chart | null>(null);

  const actual = 79.0;
  const standard = 80.9;
  const diffPercent = actual - standard; // Difference in percentage

  let barColor = '';
  if (diffPercent >= -1.4) {
    barColor = 'green'; // Greater than or equal to -1.4 (includes positive values)
  } else if (diffPercent < -1.4 && diffPercent >= -1.9) {
    barColor = 'yellow'; // Less than -1.4 and greater than or equal to -1.9
  } else {
    barColor = 'red'; // Less than -1.9
  }

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // ✅ Destroy previous daily chart if exists
    if (dailyChartInstanceRef.current) {
      dailyChartInstanceRef.current.destroy();
    }

    const dailyCanvas = dailyChartRef.current;
    if (dailyCanvas) {
      const dailyChartData = {
        labels: ['Actual', 'Standard'],
        datasets: [
          {
            label: 'Eggs Count',
            data: [actual, standard],
            backgroundColor: [barColor, '#2196F3'],
          },
        ],
      };

      const dailyChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'x',
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Eggs Count',
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.formattedValue}`,
            },
          },
        },
      };

      dailyChartInstanceRef.current = new Chart(dailyCanvas, {
        type: 'bar',
        data: dailyChartData,
        options: dailyChartOptions,
      });
    }

    // ✅ Destroy previous monthly chart if exists
    if (monthlyChartInstanceRef.current) {
      monthlyChartInstanceRef.current.destroy();
    }

    const monthlyCanvas = monthlyChartRef.current;
    if (monthlyCanvas) {
      const monthlyChartData = {
        labels: ['Sep', 'Oct'],
        datasets: [
          {
            label: 'Production',
            data: [240000, 250000],
            backgroundColor: ['#4CAF50', '#2196F3'],
          },
        ],
      };

      const monthlyChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'x',
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Production',
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.formattedValue}`,
            },
          },
        },
      };

      monthlyChartInstanceRef.current = new Chart(monthlyCanvas, {
        type: 'bar',
        data: monthlyChartData,
        options: monthlyChartOptions,
      });
    }

    // ✅ Optional: Cleanup charts on component unmount
    return () => {
      if (dailyChartInstanceRef.current) {
        dailyChartInstanceRef.current.destroy();
      }
      if (monthlyChartInstanceRef.current) {
        monthlyChartInstanceRef.current.destroy();
      }
    };
  }, [isMobile, actual, standard, barColor]);

  return (
    <div className="row g-2 mb-2">
      <div className={isMobile ? 'col-12' : 'col-6'}>
        <ChartContainer title="Eggs (Actual vs. Standard)">
          <canvas ref={dailyChartRef} style={{ width: '100%', height: isMobile ? '250px' : '200px' }} />
        </ChartContainer>
      </div>

      <div className={isMobile ? 'col-12' : 'col-6'}>
        <ChartContainer title="Egg Production">
          <canvas ref={monthlyChartRef} style={{ width: '100%', height: isMobile ? '250px' : '200px' }} />
        </ChartContainer>
      </div>
    </div>
  );
};

export default GraphsSection;
