/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

interface Project {
  id: string;
  status: string;
  name?: string;
  [key: string]: any;
}

interface Ticket {
  id: string;
  status: string;
  priority: string;
  title?: string;
  [key: string]: any;
}

interface Invoice {
  id: string;
  status: string;
  amount: number;
  [key: string]: any;
}

interface StatusData {
  projects: Project[];
  tickets: Ticket[];
  invoices: Invoice[];
}

const StatusWidgets: React.FC = () => {
  const [statusData, setStatusData] = useState<StatusData>({
    projects: [],
    tickets: [],
    invoices: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatusData();
  }, []);

  const loadStatusData = async () => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await apiClient.get('/dashboard/stats');

      if (response.error || !response.data) {
        throw new Error(response.error || 'Failed to fetch dashboard stats');
      }

      const stats = response.data;

      // Transform the stats data to match the expected interface
      const typedStats = stats as any;
      setStatusData({
        projects: Array(typedStats.projects?.total || 0)
          .fill(null)
          .map((_, i) => ({
            id: `project-${i}`,
            status: i < typedStats.projects?.active ? 'active' : 'completed',
          })),
        tickets: Array(
          (typedStats.tickets?.open || 0) +
            (typedStats.tickets?.inProgress || 0)
        )
          .fill(null)
          .map((_, i) => ({
            id: `ticket-${i}`,
            status: i < typedStats.tickets?.open ? 'open' : 'in-progress',
            priority: i < typedStats.tickets?.highPriority ? 'high' : 'medium',
          })),
        invoices: Array(typedStats.invoices?.pending || 0)
          .fill(null)
          .map((_, i) => ({
            id: `invoice-${i}`,
            status: 'pending',
            amount:
              Math.floor(
                (typedStats.invoices?.pendingAmount || 0) /
                  (typedStats.invoices?.pending || 1)
              ) || 0,
          })),
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug('Error loading status data:', error);
      }
      // Set empty data on error to prevent infinite loading
      setStatusData({ projects: [], tickets: [], invoices: [] });
    } finally {
      setLoading(false);
    }
  };

  const getProjectsStats = () => {
    const total = statusData.projects.length;
    const active = statusData.projects.filter(
      (p: Project) =>
        p.status &&
        (p.status.toLowerCase() === 'active' ||
          p.status.toLowerCase() === 'in-progress')
    ).length;
    return { total, active };
  };

  const getTicketsStats = () => {
    const openTickets = statusData.tickets.filter(
      (t: Ticket) =>
        t.status &&
        (t.status.toLowerCase() === 'open' ||
          t.status.toLowerCase() === 'in-progress')
    );
    const total = openTickets.length;
    const highPriority = openTickets.filter(
      (t: Ticket) =>
        t.priority &&
        (t.priority.toLowerCase() === 'high' ||
          t.priority.toLowerCase() === 'critical')
    ).length;
    return { total, highPriority };
  };

  const getInvoicesStats = () => {
    const pendingInvoices = statusData.invoices.filter(
      (i: Invoice) =>
        i.status &&
        (i.status.toLowerCase() === 'draft' ||
          i.status.toLowerCase() === 'issued')
    );
    const total = pendingInvoices.length;
    const amount = pendingInvoices.reduce(
      (sum: number, invoice: Invoice) => sum + (invoice.amount || 0),
      0
    );
    return { total, amount };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const projectsStats = getProjectsStats();
  const ticketsStats = getTicketsStats();
  const invoicesStats = getInvoicesStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Projects Widget */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500">Total Projects</h3>
          <svg
            className="h-5 w-5 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <div className="flex items-baseline">
          <p className="text-2xl font-semibold text-gray-900">
            {projectsStats.total}
          </p>
          <p className="ml-2 text-sm text-gray-500">projects</p>
        </div>
        <div className="mt-2">
          <p className="text-xs text-green-600">
            {projectsStats.active} active
          </p>
        </div>
      </div>

      {/* Tickets Widget */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500">Open Tickets</h3>
          <svg
            className="h-5 w-5 text-yellow-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
        </div>
        <div className="flex items-baseline">
          <p className="text-2xl font-semibold text-gray-900">
            {ticketsStats.total}
          </p>
          <p className="ml-2 text-sm text-gray-500">tickets</p>
        </div>
        <div className="mt-2">
          <p className="text-xs text-red-600">
            {ticketsStats.highPriority} high priority
          </p>
        </div>
      </div>

      {/* Invoices Widget */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500">
            Pending Invoices
          </h3>
          <svg
            className="h-5 w-5 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="flex items-baseline">
          <p className="text-2xl font-semibold text-gray-900">
            {invoicesStats.total}
          </p>
          <p className="ml-2 text-sm text-gray-500">invoices</p>
        </div>
        <div className="mt-2">
          <p className="text-xs text-gray-600">
            Rp {invoicesStats.amount.toLocaleString('id-ID')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatusWidgets;
