import {
  Project as PrismaProject,
  Milestone as PrismaMilestone,
  Ticket as PrismaTicket,
  Invoice,
  User,
} from '@prisma/client';

// ============================================================================
// PROJECT TYPES (Enhanced with Prisma compatibility)
// ============================================================================

/**
 * Project with relations for dashboard operations
 */
export type ProjectWithRelations = PrismaProject & {
  milestones?: PrismaMilestone[];
  tickets?: PrismaTicket[];
  _count?: {
    milestones: number;
    tickets: number;
  };
};

/**
 * Project overview with metrics - replaces any types in dashboard controller
 */
export interface ProjectWithMetrics {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  totalMilestones: number;
  completedMilestones: number;
  openTickets: number;
  highPriorityTickets: number;
  createdAt: Date;
  updatedAt: Date;
  startAt: Date | null;
  dueAt: Date | null;
  stagingUrl: string | null;
  productionUrl: string | null;
  repositoryUrl: string | null;
}

// ============================================================================
// DASHBOARD STATISTICS TYPES
// ============================================================================

/**
 * Complete dashboard statistics structure - replaces any types
 */
export interface DashboardStats {
  projects: ProjectStats;
  tickets: TicketStats;
  invoices: InvoiceStats;
  milestones: MilestoneStats;
}

/**
 * Project statistics
 */
export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  onHold: number;
}

/**
 * Ticket statistics
 */
export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  highPriority: number;
  critical: number;
}

/**
 * Invoice statistics
 */
export interface InvoiceStats {
  total: number;
  pending: number;
  overdue: number;
  totalAmount: number;
  pendingAmount: number;
}

/**
 * Milestone statistics
 */
export interface MilestoneStats {
  total: number;
  completed: number;
  overdue: number;
  dueThisWeek: number;
}

// ============================================================================
// ACTIVITY AND FEEDBACK TYPES
// ============================================================================

/**
 * Recent activity item structure - replaces any types
 */
export interface RecentActivity {
  id: string;
  type: 'project' | 'ticket' | 'milestone' | 'invoice';
  title: string;
  description: string;
  status: string;
  createdAt: Date;
  priority?: string;
  dueDate?: Date;
}

/**
 * Dashboard update payload for WebSocket broadcasting
 */
export interface DashboardUpdatePayload {
  type: 'stats' | 'activity' | 'project' | 'ticket' | 'milestone' | 'invoice';
  data: Record<string, unknown>;
  timestamp: Date;
  organizationId: string;
}

// ============================================================================
// ANALYTICS AND TRENDS TYPES
// ============================================================================

/**
 * Analytics trends response - replaces any types in analytics endpoints
 */
export interface AnalyticsTrendsResponse {
  period: string;
  startDate: Date;
  endDate: Date;
  trends: Record<string, MetricTrend>;
}

/**
 * Trend data for a specific metric
 */
export interface MetricTrend {
  total: number;
  daily: DailyDataPoint[];
  completionRate?: number;
  averageDuration?: number;
  resolutionRate?: number;
  highPriorityRate?: number;
  onTimeDeliveryRate?: number;
  totalAmount?: number;
  paidRate?: number;
}

/**
 * Daily data point for trend analysis
 */
export interface DailyDataPoint {
  date: string;
  count: number;
}

/**
 * Performance metrics response
 */
export interface PerformanceMetricsResponse {
  period: string;
  startDate: Date;
  endDate: Date;
  projectPerformance: ProjectPerformanceMetrics;
  ticketResolution: TicketResolutionMetrics;
  milestoneCompletion: MilestoneCompletionMetrics;
  invoiceMetrics: InvoicePerformanceMetrics;
}

/**
 * Project performance metrics
 */
export interface ProjectPerformanceMetrics {
  totalProjects: number;
  averageMilestonesPerProject: number;
  averageTicketsPerProject: number;
  onTimeCompletionRate: number;
  budgetAdherence: number;
}

/**
 * Ticket resolution metrics
 */
export interface TicketResolutionMetrics {
  totalTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
  resolutionRateByPriority: Record<string, number>;
  slaComplianceRate: number;
}

/**
 * Milestone completion metrics
 */
export interface MilestoneCompletionMetrics {
  totalMilestones: number;
  completedMilestones: number;
  averageCompletionTime: number;
  overdueRate: number;
}

/**
 * Invoice performance metrics
 */
export interface InvoicePerformanceMetrics {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  averagePaymentTime: number;
  overdueRate: number;
}

/**
 * Forecast analytics response
 */
export interface ForecastAnalyticsResponse {
  horizon: string;
  forecastDate: Date;
  currentDate: Date;
  projectForecast: ProjectForecast;
  milestoneForecast: MilestoneForecast;
  invoiceForecast: InvoiceForecast;
  resourceForecast: ResourceForecast;
}

/**
 * Project forecast data
 */
export interface ProjectForecast {
  activeProjects: number;
  projectsCompletingSoon: number;
  upcomingMilestones: number;
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Milestone forecast data
 */
export interface MilestoneForecast {
  pendingMilestones: number;
  overdueMilestones: number;
  dueThisWeek: number;
  milestones: PendingMilestoneInfo[];
}

/**
 * Pending milestone information
 */
export interface PendingMilestoneInfo {
  id: string;
  title: string;
  dueAt: Date | null;
  status: string;
  project: {
    name: string;
    status: string;
  };
}

/**
 * Invoice forecast data
 */
export interface InvoiceForecast {
  pendingInvoices: number;
  totalPendingAmount: number;
  overdueAmount: number;
  dueThisMonth: number;
}

/**
 * Resource forecast data
 */
export interface ResourceForecast {
  activeProjects: number;
  totalWorkload: number;
  averageWorkloadPerProject: number;
  resourceUtilization: number;
  recommendation: string;
}

/**
 * Predictive analytics response
 */
export interface PredictiveAnalyticsResponse {
  horizon: string;
  forecastDate: Date;
  confidenceLevel: number;
  currentDate: Date;
  predictions: {
    projects: ProjectPredictions;
    revenue: RevenuePredictions;
    risks: RiskPredictions;
    capacity: CapacityPredictions;
  };
  recommendations: string[];
}

/**
 * Project predictions
 */
export interface ProjectPredictions {
  overallCompletionRate: number;
  averageProjectDuration: number;
  predictedCompletions: number;
  highRiskProjects: number;
  projectsAtRisk: ProjectRiskPrediction[];
  detailedPredictions: ProjectPredictionDetail[];
}

/**
 * Project risk prediction
 */
export interface ProjectRiskPrediction {
  projectId: string;
  projectName: string;
  currentStatus: string;
  milestoneProgress: number;
  completionProbability: number;
  predictedCompletionDate: Date;
  riskFactors: {
    schedule: number;
    resource: number;
    complexity: number;
  };
  recommendations: string[];
}

/**
 * Detailed project prediction
 */
export interface ProjectPredictionDetail extends ProjectRiskPrediction {}

/**
 * Revenue predictions
 */
export interface RevenuePredictions {
  currentMonthlyAverage: number;
  revenueGrowthRate: number;
  predictedRevenue: number;
  pendingAmount: number;
  predictedCollection: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  seasonalTrends: string[];
}

/**
 * Risk predictions
 */
export interface RiskPredictions {
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskCategories: {
    operational: number;
    financial: number;
    capacity: number;
  };
  riskTrend: 'improving' | 'stable' | 'degrading';
  riskFactors: {
    criticalTickets: number;
    overdueMilestones: number;
    overdueInvoices: number;
  };
  mitigationStrategies: string[];
}

/**
 * Capacity predictions
 */
export interface CapacityPredictions {
  currentUtilization: number;
  projectedUtilization: number;
  availableCapacity: number;
  capacityBuffer: number;
  canTakeNewProjects: boolean;
  recommendedTeamSize: number;
  burnoutRisk: 'low' | 'medium' | 'high';
  scalingRecommendations: string[];
}

// ============================================================================
// WEBSOCKET AND AUTHENTICATION TYPES
// ============================================================================

/**
 * Authenticated WebSocket socket interface - replaces any types in gateway
 */
export interface AuthenticatedSocket {
  userId?: string;
  organizationId?: string;
  userRole?: string;
  handshake: {
    auth: {
      token?: string;
    };
    headers: {
      authorization?: string;
    };
  };
  id: string;
  join: (room: string) => Promise<void>;
  leave: (room: string) => Promise<void>;
  emit: (event: string, data: unknown) => void;
  disconnect: () => void;
}

/**
 * JWT payload structure
 */
export interface JwtPayload {
  sub: string;
  organizationId: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * User with memberships for authentication
 */
export type UserWithMemberships = User & {
  memberships?: Array<{
    id: string;
    organizationId: string;
    role: string;
  }>;
};

// ============================================================================
// LEGACY COMPATIBILITY TYPES (Maintained for backward compatibility)
// ============================================================================

/**
 * Legacy Project interface - maintained for compatibility
 * @deprecated Use ProjectWithRelations or ProjectWithMetrics instead
 */
export interface Project {
  id: string;
  name: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  milestones?: Milestone[];
  tickets?: Ticket[];
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
}

/**
 * Legacy Milestone interface
 * @deprecated Use Prisma Milestone type instead
 */
export interface Milestone {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Legacy Ticket interface
 * @deprecated Use Prisma Ticket type instead
 */
export interface Ticket {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Legacy ProjectWithMetrics interface - extended for compatibility
 * @deprecated Use the new ProjectWithMetrics interface above
 */
export interface ProjectWithMetricsLegacy extends Project {
  progress: number;
  totalMilestones: number;
  completedMilestones: number;
  openTickets: number;
  highPriorityTickets: number;
  completionRate?: number;
  daysRemaining?: number;
  isOverdue?: boolean;
}

/**
 * Legacy DashboardStats interface - maintained for compatibility
 * @deprecated Use the new DashboardStats interface above
 */
export interface DashboardStatsLegacy {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  totalMilestones: number;
  completedMilestones: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
}

// ============================================================================
// NOTIFICATION AND CHART TYPES (Preserved from original)
// ============================================================================

/**
 * Analytics data structure
 */
export interface AnalyticsData {
  period: string;
  projects: number;
  tickets: number;
  invoices: number;
  milestones: number;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  email: {
    projects: boolean;
    tickets: boolean;
    invoices: boolean;
    milestones: boolean;
  };
  inApp: {
    projects: boolean;
    tickets: boolean;
    invoices: boolean;
    milestones: boolean;
  };
  desktop: {
    projects: boolean;
    tickets: boolean;
    invoices: boolean;
    milestones: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  digest: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'never';
  };
}

/**
 * Chart data structure
 */
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Safe type for object property access that prevents prototype pollution
 */
export type SafeObjectKey = string & {
  _BRAND: 'SafeObjectKey';
};

/**
 * Function to validate and create safe object keys
 */
export function createSafeObjectKey(key: string): SafeObjectKey {
  // Validate key to prevent prototype pollution
  const forbidden = ['__proto__', 'constructor', 'prototype'];
  if (forbidden.includes(key) || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
    throw new Error(`Unsafe object key: ${key}`);
  }
  return key as SafeObjectKey;
}

/**
 * Type-safe record that prevents prototype pollution
 */
export interface SafeRecord<T = unknown> {
  [key: SafeObjectKey]: T;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: Date;
    requestId: string;
  };
}

/**
 * Type-safe invoice item for dashboard processing
 */
export type InvoiceItem = {
  id: string;
  status: string;
  amount: number | null;
  dueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Type-safe ticket item for dashboard processing
 */
export type TicketItem = {
  id: string;
  type: string;
  priority: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Type-safe milestone item for dashboard processing
 */
export type MilestoneItem = {
  id: string;
  title: string;
  status: string;
  dueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
