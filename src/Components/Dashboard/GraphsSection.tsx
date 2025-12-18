import React, { useState, useEffect } from "react";
import { CircleGauge } from "lucide-react";

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, icon }) => (
  <div className="card shadow-sm h-100">
    <div className="card-body p-0">
      <h6 className="card-title mb-2 px-2 pt-2 d-flex align-items-center">
        {icon && (
          <div className="me-2 d-flex align-items-center justify-content-center bg-primary-subtle p-2 rounded-3">
            {icon}
          </div>
        )}
        {title}
      </h6>
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
  const hd = henDayValue; // Use the prop instead of hardcoding

  let barColor = "";
  if (hd >= 80 && hd <= 100) {
    barColor = "bg-success"; // green
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
        <ChartContainer title="Hen Day (HD) %" icon={<CircleGauge className="text-primary" size={20} />}>
          <div
            className="progress"
            style={{ height: isMobile ? "30px" : "20px" }}
          >
            <div
              className={`progress-bar ${barColor} ${getTextColor(barColor)}`}
              role="progressbar"
              style={{ width: `${hd}%` }}
              aria-valuenow={hd}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {hd.toFixed(2)}%
            </div>
          </div>
        </ChartContainer>
      </div>
    </div>
  );
};

export default GraphsSection;