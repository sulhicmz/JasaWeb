import React, { useState, useEffect } from 'react';

interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number; // 0-100
  dependencies?: string[]; // IDs of tasks this task depends on
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue';
}

interface GanttData {
  tasks: GanttTask[];
}

const GanttChart: React.FC = () => {
  const [ganttData, setGanttData] = useState<GanttData>({ tasks: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGanttData();
  }, []);

  const loadGanttData = async () => {
    try {
      const token = localStorage.getItem('authToken');

      // For now, we'll use mock data. In a real implementation, this would come from the API
      const mockTasks: GanttTask[] = [
        {
          id: '1',
          name: 'Project Setup',
          start: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          end: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          progress: 100,
          status: 'completed'
        },
        {
          id: '2',
          name: 'Design Phase',
          start: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
          end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          progress: 80,
          dependencies: ['1'],
          status: 'in-progress'
        },
        {
          id: '3',
          name: 'Development',
          start: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          end: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          progress: 40,
          dependencies: ['2'],
          status: 'in-progress'
        },
        {
          id: '4',
          name: 'Testing',
          start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          progress: 0,
          dependencies: ['3'],
          status: 'not-started'
        },
        {
          id: '5',
          name: 'Deployment',
          start: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
          end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          progress: 0,
          dependencies: ['4'],
          status: 'not-started'
        }
      ];

      // In a real implementation, we would fetch from the API
      // const response = await fetch('http://localhost:3001/projects/gantt', {
      //   headers: { Authorization: `Bearer ${token}` },
      // });
      //
      // if (response.ok) {
      //   const data = await response.json();
      //   setGanttData(data);
      // } else {
      //   setGanttData({ tasks: mockTasks });
      // }

      setGanttData({ tasks: mockTasks });
    } catch (error) {
      console.error('Error loading Gantt data:', error);
      // Use mock data in case of error
      const mockTasks: GanttTask[] = [
        {
          id: '1',
          name: 'Project Setup',
          start: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          end: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          progress: 100,
          status: 'completed'
        },
        {
          id: '2',
          name: 'Design Phase',
          start: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          progress: 80,
          status: 'in-progress'
        }
      ];
      setGanttData({ tasks: mockTasks });
    } finally {
      setLoading(false);
    }
  };

  // Function to calculate the position and width of each task bar
  const calculateTaskPosition = (task: GanttTask) => {
    const today = new Date();
    const startDate = new Date(Math.min(...ganttData.tasks.map(t => t.start.getTime())));
    const endDate = new Date(Math.max(...ganttData.tasks.map(t => t.end.getTime())));
    const totalDuration = endDate.getTime() - startDate.getTime();
    
    const taskStartOffset = task.start.getTime() - startDate.getTime();
    const taskDuration = task.end.getTime() - task.start.getTime();
    
    const leftPercent = (taskStartOffset / totalDuration) * 100;
    const widthPercent = (taskDuration / totalDuration) * 100;
    
    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Timeline</h3>
        <div className="animate-pulse h-64 w-full bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Project Timeline</h3>
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Timeline header */}
          <div className="flex border-b border-gray-200 pb-2 mb-4">
            <div className="w-1/4 font-medium text-gray-700">Task</div>
            <div className="w-3/4 flex">
              {/* Render time markers */}
              <div className="flex-1 text-center text-xs text-gray-500">Start</div>
              <div className="flex-1 text-center text-xs text-gray-500">Today</div>
              <div className="flex-1 text-center text-xs text-gray-500">End</div>
            </div>
          </div>
          
          {/* Task rows */}
          {ganttData.tasks.map((task) => {
            const position = calculateTaskPosition(task);
            const statusColor = 
              task.status === 'completed' ? 'bg-green-500' :
              task.status === 'in-progress' ? 'bg-blue-500' :
              task.status === 'overdue' ? 'bg-red-500' : 'bg-gray-400';
              
            return (
              <div key={task.id} className="flex items-center py-2 border-b border-gray-100">
                <div className="w-1/4 pr-4">
                  <div className="font-medium text-gray-900">{task.name}</div>
                  <div className="text-xs text-gray-500">
                    {task.start.toLocaleDateString()} - {task.end.toLocaleDateString()}
                  </div>
                </div>
                <div className="w-3/4 relative h-10">
                  {/* Timeline bar */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 transform -translate-y-1/2"></div>
                  
                  {/* Task bar */}
                  <div
                    className={`absolute top-1/2 h-6 rounded-md transform -translate-y-1/2 ${statusColor} text-white flex items-center justify-center text-xs font-medium`}
                    style={{ left: position.left, width: position.width }}
                  >
                    {/* Progress indicator */}
                    <div className="absolute top-0 left-0 h-full bg-black bg-opacity-20 rounded-l-md"
                         style={{ width: `${task.progress}%` }}>
                    </div>
                    {task.progress}%
                  </div>
                  
                  {/* Today marker */}
                  <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                       style={{ left: '50%' }}>
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-red-500 text-xs">Today</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GanttChart;