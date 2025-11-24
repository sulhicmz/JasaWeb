import React, { useState, useEffect } from 'react';

interface DeadlineAlert {
  id: string;
  name: string;
  dueDate: string;
  daysRemaining: number | null;
  status: string;
  overdue: boolean;
}

const DeadlineAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<DeadlineAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeadlineAlerts();
  }, []);

  const loadDeadlineAlerts = async () => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch('http://localhost:3001/analytics/enhanced-dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.deadlineAlerts || []);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug('Error loading deadline alerts:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Deadline Alerts</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Deadline Alerts</h3>
        <p className="text-gray-500">No upcoming deadlines to display.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Project Deadline Alerts</h3>
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-3 rounded-md border-l-4 ${
              alert.overdue
                ? 'bg-red-50 border-red-400'
                : alert.daysRemaining === 0
                ? 'bg-yellow-50 border-yellow-400'
                : alert.daysRemaining! <= 3
                ? 'bg-orange-50 border-orange-400'
                : 'bg-blue-50 border-blue-400'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{alert.name}</h4>
                <p className="text-sm text-gray-500">Due: {new Date(alert.dueDate).toLocaleDateString()}</p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  alert.overdue
                    ? 'bg-red-100 text-red-800'
                    : alert.daysRemaining === 0
                    ? 'bg-yellow-100 text-yellow-800'
                    : alert.daysRemaining! <= 3
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {alert.overdue
                  ? 'Overdue'
                  : alert.daysRemaining === 0
                  ? 'Due Today'
                  : `${alert.daysRemaining} days left`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeadlineAlerts;