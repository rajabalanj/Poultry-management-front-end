import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import '../../styles/global.css';

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children }) => (
  <div className="card shadow-sm h-100">
    <div className="card-body p-2 p-sm-3">
      <h6 className="card-title mb-2 text-sm">{title}</h6>
      {children}
    </div>
  </div>
);

const GraphsSection: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dailyData = {
    labels: ['Today', 'Yesterday'],
    values: [14000, 14500]
  };

  const monthlyData = {
    labels: ['Sep', 'Oct'],
    values: [240000, 250000]
  };

  // Common layout settings for both charts
  const commonLayout = {
    height: 200,
    margin: { t: 10, r: 10, l: 40, b: 30 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: {
      size: isMobile ? 10 : 12,
      family: 'Arial, sans-serif'
    },
    yaxis: {
      title: {
        font: {
          size: isMobile ? 10 : 14
        }
      },
      tickfont: {
        size: isMobile ? 9 : 12
      },
      gridcolor: '#eee'
    },
    xaxis: {
      tickfont: {
        size: isMobile ? 9 : 12
      },
      gridcolor: '#eee'
    }
  };

  return (
    <div className="row g-2 mb-2">
      <div className="col-6">
        <ChartContainer title="Eggs (Today vs. Yesterday)">
          <Plot
            data={[
              {
                type: 'bar',
                x: dailyData.labels,
                y: dailyData.values,
                marker: {
                  color: ['#4CAF50', '#2196F3']
                },
                text: dailyData.values.map(String),
                textposition: 'auto',
                textfont: {
                  size: isMobile ? 9 : 12
                }
              }
            ]}
            layout={{
              ...commonLayout,
              yaxis: {
                ...commonLayout.yaxis,
                title: 'Eggs Count'
              }
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%' }}
          />
        </ChartContainer>
      </div>

      <div className="col-6">
        <ChartContainer title="Egg Production">
          <Plot
            data={[
              {
                type: 'bar',
                x: monthlyData.labels,
                y: monthlyData.values,
                marker: {
                  color: ['#4CAF50', '#2196F3']
                },
                text: monthlyData.values.map(String),
                textposition: 'auto',
                textfont: {
                  size: isMobile ? 9 : 12
                }
              }
            ]}
            layout={{
              ...commonLayout,
              yaxis: {
                ...commonLayout.yaxis,
                title: 'Monthly Production'
              }
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%' }}
          />
        </ChartContainer>
      </div>
    </div>
  );
};

export default GraphsSection; 