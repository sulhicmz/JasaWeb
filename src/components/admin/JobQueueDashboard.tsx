import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';

interface Job {
    id: string;
    type: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    priority: number;
    attempts: number;
    createdAt: string;
    scheduledAt: string;
    startedAt?: string;
    completedAt?: string;
    error?: {
        message: string;
        code?: string;
    };
    result?: any;
    progress?: number;
}

interface JobStats {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    cancelled: number;
}

interface ProcessorStatus {
    isRunning: boolean;
    processingJobs: number;
    maxConcurrentJobs: number;
    registeredHandlers: string[];
}

export default function JobQueueDashboard() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [stats, setStats] = useState<JobStats | null>(null);
    const [processorStatus, setProcessorStatus] = useState<ProcessorStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        status: '',
        type: '',
        limit: 20
    });

    const fetchJobs = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filter.status) params.set('status', filter.status);
            if (filter.type) params.set('type', filter.type);
            params.set('limit', filter.limit.toString());

            const response = await fetch(`${API_ENDPOINTS.ADMIN.JOBS}?${params}`);
            const data = await response.json();
            
            setJobs(data.jobs || []);
            setStats(data.stats);
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchJobs();
        fetchStatus();
        
        const interval = setInterval(() => {
            fetchJobs();
            fetchStatus();
        }, 5000);

        return () => clearInterval(interval);
    }, [fetchJobs]);

    const fetchStatus = useCallback(async () => {
        try {
            const response = await fetch(API_ENDPOINTS.ADMIN.JOB_STATUS);
            const data = await response.json();

            setProcessorStatus(data.processor);
        } catch (error) {
            console.error('Failed to fetch status:', error);
        }
    }, []);

    const handleStartProcessor = async () => {
        try {
            await fetch(API_ENDPOINTS.ADMIN.JOB_STATUS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start' })
            });
            fetchStatus();
        } catch (error) {
            console.error('Failed to start processor:', error);
        }
    };

    const handleStopProcessor = async () => {
        try {
            await fetch(API_ENDPOINTS.ADMIN.JOB_STATUS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop' })
            });
            fetchStatus();
        } catch (error) {
            console.error('Failed to stop processor:', error);
        }
    };

    const handleRetryJob = async (jobId: string) => {
        try {
            await fetch(`${API_ENDPOINTS.ADMIN.JOBS}/${jobId}/retry`, {
                method: 'POST'
            });
            fetchJobs();
        } catch (error) {
            console.error('Failed to retry job:', error);
        }
    };

    const handleCancelJob = async (jobId: string) => {
        try {
            await fetch(`/api/admin/jobs/${jobId}`, {
                method: 'DELETE'
            });
            fetchJobs();
        } catch (error) {
            console.error('Failed to cancel job:', error);
        }
    };

    const getStatusColor = (status: Job['status']) => {
        switch (status) {
            case 'pending': return 'text-yellow-400';
            case 'processing': return 'text-blue-400';
            case 'completed': return 'text-green-400';
            case 'failed': return 'text-red-400';
            case 'cancelled': return 'text-gray-400';
            default: return 'text-gray-400';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-400">Loading job queue...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Background Job Queue</h1>
                <div className="flex gap-2">
                    {processorStatus?.isRunning ? (
                        <Button onClick={handleStopProcessor} variant="secondary">
                            Stop Processor
                        </Button>
                    ) : (
                        <Button onClick={handleStartProcessor} variant="primary">
                            Start Processor
                        </Button>
                    )}
                </div>
            </div>

            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <Card className="p-4">
                        <div className="text-2xl font-bold text-white">{stats.total}</div>
                        <div className="text-sm text-gray-400">Total Jobs</div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
                        <div className="text-sm text-gray-400">Pending</div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-2xl font-bold text-blue-400">{stats.processing}</div>
                        <div className="text-sm text-gray-400">Processing</div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
                        <div className="text-sm text-gray-400">Completed</div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
                        <div className="text-sm text-gray-400">Failed</div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-2xl font-bold text-gray-400">{stats.cancelled}</div>
                        <div className="text-sm text-gray-400">Cancelled</div>
                    </Card>
                </div>
            )}

            {processorStatus && (
                <Card className="p-4">
                    <h2 className="text-lg font-semibold text-white mb-4">Processor Status</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-gray-400">Status:</span>
                            <span className={`ml-2 ${processorStatus.isRunning ? 'text-green-400' : 'text-red-400'}`}>
                                {processorStatus.isRunning ? 'Running' : 'Stopped'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-400">Processing:</span>
                            <span className="ml-2 text-white">
                                {processorStatus.processingJobs}/{processorStatus.maxConcurrentJobs}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-400">Handlers:</span>
                            <span className="ml-2 text-white">
                                {processorStatus.registeredHandlers.length}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-400">Max Concurrent:</span>
                            <span className="ml-2 text-white">
                                {processorStatus.maxConcurrentJobs}
                            </span>
                        </div>
                    </div>
                </Card>
            )}

            <Card className="p-4">
                <div className="flex flex-wrap gap-4">
                    <select
                        value={filter.status}
                        onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                        className="px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    
                    <select
                        value={filter.type}
                        onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                        className="px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500"
                    >
                        <option value="">All Types</option>
                        <option value="email_notification">Email Notification</option>
                        <option value="report_generation">Report Generation</option>
                        <option value="data_processing">Data Processing</option>
                    </select>
                    
                    <select
                        value={filter.limit.toString()}
                        onChange={(e) => setFilter({ ...filter, limit: parseInt(e.target.value) })}
                        className="px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500"
                    >
                        <option value="10">10 Jobs</option>
                        <option value="20">20 Jobs</option>
                        <option value="50">50 Jobs</option>
                        <option value="100">100 Jobs</option>
                    </select>
                </div>
            </Card>

            <Card className="p-4">
                <h2 className="text-lg font-semibold text-white mb-4">Recent Jobs</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="text-left py-2 px-4 text-gray-400">ID</th>
                                <th className="text-left py-2 px-4 text-gray-400">Type</th>
                                <th className="text-left py-2 px-4 text-gray-400">Status</th>
                                <th className="text-left py-2 px-4 text-gray-400">Priority</th>
                                <th className="text-left py-2 px-4 text-gray-400">Attempts</th>
                                <th className="text-left py-2 px-4 text-gray-400">Created</th>
                                <th className="text-left py-2 px-4 text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map((job) => (
                                <tr key={job.id} className="border-b border-gray-800">
                                    <td className="py-2 px-4 text-gray-300 font-mono text-xs">
                                        {job.id.slice(0, 8)}...
                                    </td>
                                    <td className="py-2 px-4 text-gray-300">{job.type}</td>
                                    <td className={`py-2 px-4 ${getStatusColor(job.status)}`}>
                                        {job.status}
                                    </td>
                                    <td className="py-2 px-4 text-gray-300">{job.priority}</td>
                                    <td className="py-2 px-4 text-gray-300">{job.attempts}</td>
                                    <td className="py-2 px-4 text-gray-300 text-xs">
                                        {formatDate(job.createdAt)}
                                    </td>
                                    <td className="py-2 px-4">
                                        <div className="flex gap-2">
                                            {job.status === 'failed' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleRetryJob(job.id)}
                                                >
                                                    Retry
                                                </Button>
                                            )}
                                            {(job.status === 'pending' || job.status === 'processing') && (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleCancelJob(job.id)}
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {jobs.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                            No jobs found
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}