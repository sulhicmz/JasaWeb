import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { cn } from '../../lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }[];
}

export interface BaseChartProps {
  data: ChartData;
  title?: string;
  height?: number;
  className?: string;
}

export interface LineChartProps extends BaseChartProps {
  options?: any;
}

export function LineChart({
  data,
  title,
  height = 300,
  options = {},
  className,
}: LineChartProps) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    ...options,
  };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <Line data={data} options={defaultOptions} />
    </div>
  );
}

export interface BarChartProps extends BaseChartProps {
  options?: any;
  horizontal?: boolean;
}

export function BarChart({
  data,
  title,
  height = 300,
  options = {},
  horizontal = false,
  className,
}: BarChartProps) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    indexAxis: horizontal ? ('y' as const) : ('x' as const),
    ...options,
  };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <Bar data={data} options={defaultOptions} />
    </div>
  );
}

export interface PieChartProps extends BaseChartProps {
  options?: any;
}

export function PieChart({
  data,
  title,
  height = 300,
  options = {},
  className,
}: PieChartProps) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: !!title,
        text: title,
      },
    },
    ...options,
  };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <Pie data={data} options={defaultOptions} />
    </div>
  );
}

export interface DoughnutChartProps extends BaseChartProps {
  options?: any;
  cutout?: string | number;
}

export function DoughnutChart({
  data,
  title,
  height = 300,
  options = {},
  cutout = '50%',
  className,
}: DoughnutChartProps) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: !!title,
        text: title,
      },
    },
    cutout,
    ...options,
  };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <Doughnut data={data} options={defaultOptions} />
    </div>
  );
}

// Chart Grid Component for displaying multiple charts
export interface ChartGridProps {
  charts: {
    component: React.ComponentType<any>;
    props: any;
    span?: number; // 1-12 for grid columns
  }[];
  className?: string;
}

export function ChartGrid({ charts, className }: ChartGridProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-6', className)}>
      {charts.map((chart, index) => (
        <div
          key={index}
          className={cn(
            'col-span-1',
            chart.span && `md:col-span-${Math.min(chart.span, 12)}`
          )}
        >
          <chart.component {...chart.props} />
        </div>
      ))}
    </div>
  );
}

// Predefined color schemes
export const chartColors = {
  primary: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'],
  success: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'],
  warning: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#FEF3C7'],
  danger: ['#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2'],
  purple: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'],
  gray: ['#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6'],
};
