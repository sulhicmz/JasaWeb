/**
 * Chart Type Definitions
 *
 * These type definitions are created to avoid importing from chart.js at the top level,
 * which would pull the entire library into the bundle.
 *
 * Once chart.js is loaded, these types will be compatible with the actual chart.js types.
 */

export interface ChartData<T> {
  labels: string[];
  datasets: ChartDataset<T>[];
}

export interface ChartDataset<T> {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ChartOptions<T> {
  responsive: boolean;
  plugins: {
    legend: {
      display: boolean;
      position: 'top' | 'bottom' | 'left' | 'right';
    };
    title?: {
      display: boolean;
      text: string;
    };
  };
  scales?: {
    x: {
      beginAtZero: boolean;
      grid: {
        display: boolean;
      };
    };
    y: {
      beginAtZero: boolean;
      grid: {
        display: boolean;
      };
    };
  };
}

export type ChartType = 'bar' | 'pie' | 'line';
