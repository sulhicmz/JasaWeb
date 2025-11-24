import React, { useState, useEffect } from 'react';

interface SlaComplianceData {
  overallComplianceRate: number;
  totalTickets: number;
  resolvedTickets: number;
  compliantTickets: number;
  complianceByPriority: Record<string, { total: number; compliant: number; rate: number }>;
  averageResolutionTime: string;
}

const SlaComplianceWidget: React.FC = () => {
  const [slaData, setSlaData] = useState<SlaComplianceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSlaData();
  }, []);

  const loadSlaData = async () => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch('http://localhost:3001/analytics/sla-compliance', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSlaData(data);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug('Error loading SLA compliance data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">SLA Compliance</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!slaData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">SLA Compliance</h3>
        <p className="text-gray-500">No SLA compliance data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">SLA Compliance</h3>
      
      <div className="mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Overall Compliance</span>
          <span className="text-sm font-medium text-gray-700">{slaData.overallComplianceRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-green-600 h-2.5 rounded-full"
            style={{ width: `${slaData.overallComplianceRate}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-500">Total Tickets</p>
          <p className="text-xl font-semibold">{slaData.totalTickets}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-500">Resolved</p>
          <p className="text-xl font-semibold">{slaData.resolvedTickets}</p>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-md font-medium text-gray-900 mb-2">By Priority</h4>
        <div className="space-y-2">
          {Object.entries(slaData.complianceByPriority).map(([priority, data]) => (
            <div key={priority} className="flex items-center justify-between">
              <span className="text-sm capitalize">{priority}</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${data.rate}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium w-10">{data.rate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SlaComplianceWidget;