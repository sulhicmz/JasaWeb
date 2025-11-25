import React, { useState, useEffect } from 'react';

interface MonthlyRevenueData {
  month: string;
  amount: number;
  paid: number;
  pending: number;
}

interface FinancialOverviewData {
  totalRevenue: number;
  pendingInvoices: number;
  monthlyRevenueTrend: MonthlyRevenueData[];
  invoiceDueWarnings: number;
}

const FinancialOverview: React.FC = () => {
  const [financialData, setFinancialData] = useState<FinancialOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch('http://localhost:3001/analytics/enhanced-dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFinancialData(data.financialOverview);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug('Error loading financial data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Overview</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Overview</h3>
        <p className="text-gray-500">No financial data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-md border border-green-100">
          <p className="text-sm text-green-700">Total Revenue</p>
          <p className="text-xl font-semibold text-green-900">
            Rp {financialData.totalRevenue.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100">
          <p className="text-sm text-yellow-700">Pending Invoices</p>
          <p className="text-xl font-semibold text-yellow-900">
            Rp {financialData.pendingInvoices.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-md border border-red-100">
          <p className="text-sm text-red-700">Due Warnings</p>
          <p className="text-xl font-semibold text-red-900">
            {financialData.invoiceDueWarnings}
          </p>
        </div>
      </div>

      {financialData.monthlyRevenueTrend.length > 0 && (
        <div className="mt-4">
          <h4 className="text-md font-medium text-gray-900 mb-2">Monthly Revenue Trend</h4>
          <div className="space-y-2">
            {financialData.monthlyRevenueTrend.map((monthData, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-600 w-20">{monthData.month}</span>
                <div className="flex-1 mx-4 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(monthData.amount / (financialData.totalRevenue || 1)) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium w-20 text-right">
                  Rp {monthData.amount.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialOverview;