import React, { useEffect, useState } from 'react';

interface ChartComponentProps {
  type: 'bar' | 'pie' | 'line';
  data: any;
  options: any;
  className?: string;
}

const DynamicChart: React.FC<ChartComponentProps> = ({
  type,
  data,
  options,
  className,
}) => {
  const [ChartComponent, setChartComponent] = useState<any>(null);

  useEffect(() => {
    const loadChart = async () => {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      const { Bar, Pie, Line } = await import('react-chartjs-2');

      switch (type) {
        case 'bar':
          setChartComponent(() => (props: any) => <Bar {...props} />);
          break;
        case 'pie':
          setChartComponent(() => (props: any) => <Pie {...props} />);
          break;
        case 'line':
          setChartComponent(() => (props: any) => <Line {...props} />);
          break;
        default:
          setChartComponent(() => (props: any) => <Bar {...props} />);
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
