import React, { useState, useEffect } from "react";

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children }) => (
  <div className="card shadow-sm h-100">
    <div className="card-body p-0">
      <h6 className="card-title mb-2 text-sm px-2 pt-2">{title}</h6>
      <div className="chart-container p-2">{children}</div>
    </div>
  </div>
);

// Define the props interface for GraphsSection
interface GraphsSectionProps {
  henDayValue: number; // Expecting a number for HD
  loading: boolean;
  error: string | null;
}

const GraphsSection: React.FC<GraphsSectionProps> = ({ henDayValue }) => { // Destructure henDayValue from props
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const HD = henDayValue; // Use the prop instead of hardcoding

  let barColor = "";
  if (HD >= 80 && HD <= 100) {
    barColor = "bg-success"; // green
  } else if (HD < 80 && HD >= 50) {
    barColor = "bg-warning"; // yellow
  } else {
    barColor = "bg-danger"; // red
  }

  const getTextColor = (bgColor: string): string => {
  switch (bgColor) {
    case "bg-warning":
      return "text-dark";  // ensures readable contrast
    default:
      return "text-white"; // works for bg-success, bg-danger
  }
};

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="row g-2 mb-2">
      <div className="col-12">
        <ChartContainer title="Hen Day (HD) %">
          <div className="progress" style={{ height: isMobile ? "30px" : "20px" }}>
            <div
              className={`progress-bar ${barColor} ${getTextColor(barColor)}`}
              role="progressbar"
              style={{ width: `${HD}%` }}
              aria-valuenow={HD}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {HD}
            </div>
          </div>
        </ChartContainer>
      </div>
    </div>
  );
};

export default GraphsSection;