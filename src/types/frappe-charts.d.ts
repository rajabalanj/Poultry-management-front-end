declare module 'frappe-charts/dist/frappe-charts.min.esm' {
  interface ChartData {
    labels: string[];
    datasets: Array<{
      name: string;
      values: number[];
    }>;
  }

  interface TooltipOptions {
    formatTooltipX: (d: string) => string;
    formatTooltipY: (d: number) => string;
  }

  interface ChartOptions {
    data: ChartData;
    type: 'bar' | 'line' | 'pie' | 'percentage' | 'heatmap';
    height?: number;
    colors?: string[];
    barOptions?: {
      spaceRatio?: number;
    };
    axisOptions?: {
      xAxisMode?: 'tick' | 'span';
      yAxisMode?: 'tick' | 'span';
      xIsSeries?: boolean;
    };
    tooltipOptions?: TooltipOptions;
    valuesOverPoints?: number;
    fontSize?: number;
    isNavigable?: boolean;
    animate?: boolean;
    maxSlices?: number;
    truncateLegends?: boolean;
    yMarkers?: any[];
    yRegions?: any[];
    marginLeft?: number;
    marginRight?: number;
    marginTop?: number;
    marginBottom?: number;
  }

  class Chart {
    constructor(element: HTMLElement, options: ChartOptions);
  }

  export { Chart };
} 