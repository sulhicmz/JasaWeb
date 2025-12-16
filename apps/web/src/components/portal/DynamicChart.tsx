/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    title?: {
      display: boolean;
      text: string;
    };
  };
  scales?: {
    x?: {
      beginAtZero?: boolean;
    };
    y?: {
      beginAtZero?: boolean;
    };
  };
}

interface DynamicChartProps {
  type: 'bar' | 'pie' | 'line';
  data: ChartData;
  options: ChartOptions;
  className?: string;
}

interface ChartComponentProps {
  data: ChartData;
  options: ChartOptions;
  className?: string;
}

const DynamicChart: React.FC<DynamicChartProps> = ({
  type,
  data,
  options,
  className,
}) => {
  const [ChartComponent, setChartComponent] =
    useState<React.FC<ChartComponentProps> | null>(null);

  useEffect(() => {
    const loadChart = async () => {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      const { Bar, Pie, Line } = await import('react-chartjs-2');

      switch (type) {
        case 'bar':
          setChartComponent(() => (props: ChartComponentProps) => (
            <Bar {...(props as ChartComponentProps)} />
          ));
          break;
        case 'pie':
          setChartComponent(() => (props: ChartComponentProps) => (
            <Pie {...(props as ChartComponentProps)} />
          ));
          break;
        case 'line':
          setChartComponent(() => (props: ChartComponentProps) => (
            <Line {...(props as ChartComponentProps)} />
          ));
          break;
        default:
          setChartComponent(() => (props: ChartComponentProps) => (
            <Bar {...(props as ChartComponentProps)} />
          ));
      }
    };

    loadChart();
  }, [type]);

  if (!ChartComponent) {
    return (
      <div className={`h-64 flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <ChartComponent data={data} options={options} className={className} />;
};

export default DynamicChart;
