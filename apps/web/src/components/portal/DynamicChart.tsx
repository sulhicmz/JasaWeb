import React, { useEffect, useState } from 'react';
import { ChartData, ChartOptions, ChartType } from '../../types/chart.types';

interface ChartComponentProps {
  type: ChartType;
  data: ChartData<ChartType>;
  options: ChartOptions<ChartType>;
  className?: string;
}

interface DynamicChartProps {
  data: ChartData<ChartType>;
  options: ChartOptions<ChartType>;
  className?: string;
}

type ChartComponentType = React.FC<DynamicChartProps>;

const DynamicChart: React.FC<ChartComponentProps> = ({
  type,
  data,
  options,
  className,
}) => {
  const [ChartComponent, setChartComponent] =
    useState<ChartComponentType | null>(null);

  useEffect(() => {
    const loadChart = async () => {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      const { Bar, Pie, Line } = await import('react-chartjs-2');

      switch (type) {
        case 'bar':
          setChartComponent(() => (props: DynamicChartProps) => (
            <Bar {...props} />
          ));
          break;
        case 'pie':
          setChartComponent(() => (props: DynamicChartProps) => (
            <Pie {...props} />
          ));
          break;
        case 'line':
          setChartComponent(() => (props: DynamicChartProps) => (
            <Line {...props} />
          ));
          break;
        default:
          setChartComponent(() => (props: DynamicChartProps) => (
            <Bar {...props} />
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
