// Dashboard Stats Component
import { realtimeService } from '../../services/realtime.js';
import { offlineCache } from '../../services/offline-cache.js';
import { SkeletonLoader } from '../ui/skeleton-loader.js';

interface DashboardStats {
  projects: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
  };
  tickets: {
    total: number;
    open: number;
    inProgress: number;
    highPriority: number;
    critical: number;
  };
  invoices: {
    total: number;
    pending: number;
    overdue: number;
    totalAmount: number;
    pendingAmount: number;
  };
  milestones: {
    total: number;
    completed: number;
    overdue: number;
    dueThisWeek: number;
  };
}

class DashboardStatsComponent extends HTMLElement {
  private stats: DashboardStats | null = null;
  private loading = false;
  private error: string | null = null;
  private unsubscribeRealtime: (() => void) | null = null;
  private isOnline = navigator.onLine;
  private lastFetchTime = 0;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  connectedCallback() {
    this.render();
    this.fetchStats();
    this.setupRealtime();
    this.setupOfflineDetection();

    // Listen for refresh events
    window.addEventListener('refresh-dashboard', () => {
      this.fetchStats(true); // Force refresh
    });
  }

  disconnectedCallback() {
    if (this.unsubscribeRealtime) {
      this.unsubscribeRealtime();
    }
  }

  private setupRealtime() {
    // Subscribe to dashboard updates
    this.unsubscribeRealtime = realtimeService.subscribe(
      'dashboard-update',
      (data) => {
        console.log('Dashboard update received:', data);
        // Auto-refresh stats when dashboard update is received
        this.fetchStats(true);
      }
    );

    // Subscribe to connection status changes
    realtimeService.subscribe('connection', (data) => {
      console.log('Connection status:', data.status);
      if (data.status === 'connected' && this.isOnline) {
        // Refresh data when reconnected
        this.fetchStats(true);
      }
    });
  }

  private setupOfflineDetection() {
    // Listen for offline status changes from the service
    window.addEventListener('offline-status-changed', (event: any) => {
      this.isOnline = event.detail.isOnline;
      this.render(); // Update UI to show online status
      
      if (this.isOnline && this.stats) {
        // Refresh data when coming back online
        this.fetchStats(true);
      }
    });

    // Also listen to native events as backup
    window.addEventListener('online', () => {
      if (!this.isOnline) {
        this.isOnline = true;
        this.render();
        if (this.stats) {
          this.fetchStats(true);
        }
      }
    });

    window.addEventListener('offline', () => {
      if (this.isOnline) {
        this.isOnline = false;
        this.render();
      }
    });
  }

async fetchStats(forceRefresh = false) {
    // Check if we can use cached data
    const now = Date.now();
    if (!forceRefresh && 
        this.stats && 
        this.isOnline && 
        (now - this.lastFetchTime) < this.cacheExpiry) {
      return; // Use cached data
    }

    this.loading = true;
    this.error = null;
    this.render();

    try {
      // Use offline cache service for better reliability
      const cacheKey = 'dashboard-stats';
      const ttl = forceRefresh ? 0 : 5 * 60 * 1000; // 5 minutes or immediate expiry
      
      this.stats = await offlineCache.fetchWithCache<DashboardStats>(
        '/api/dashboard/stats',
        {
          headers: {
            'Cache-Control': forceRefresh ? 'no-cache' : 'max-age=300',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Force-Refresh': forceRefresh.toString(),
          },
        },
        cacheKey,
        ttl
      );
      
      this.lastFetchTime = now;

      // Dispatch success event for parent components
      this.dispatchEvent(
        new CustomEvent('stats-updated', {
          detail: { stats: this.stats, timestamp: new Date() },
        })
      );
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch stats';
      console.error('Error fetching dashboard stats:', err);

      // Try to load from cache as fallback
      if (!this.stats) {
        const cachedStats = offlineCache.get<DashboardStats>('dashboard-stats');
        if (cachedStats) {
          this.stats = cachedStats;
          this.lastFetchTime = Date.now() - (4 * 60 * 1000); // Show as 4 minutes old
          console.log('Loaded dashboard stats from offline cache');
        }
      }

      // Dispatch error event
      this.dispatchEvent(
        new CustomEvent('stats-error', {
          detail: { error: this.error, isOnline: this.isOnline },
        })
      );
    } finally {
      this.loading = false;
      this.render();
    }
  }

    this.loading = true;
    this.error = null;
    this.render();

    try {
      const cacheControl = forceRefresh ? 'no-cache' : 'max-age=300';
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Cache-Control': cacheControl,
          'X-Requested-With': 'XMLHttpRequest',
          'X-Force-Refresh': forceRefresh.toString(),
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}: ${errorText}`);
      }

      this.stats = await response.json();
      this.lastFetchTime = now;

      // Store in localStorage for offline fallback
      if (this.isOnline) {
        try {
          localStorage.setItem(
            'dashboard-stats-cache',
            JSON.stringify({
              data: this.stats,
              timestamp: this.lastFetchTime,
            })
          );
        } catch (e) {
          console.warn('Failed to cache stats data:', e);
        }
      }

      // Dispatch success event for parent components
      this.dispatchEvent(
        new CustomEvent('stats-updated', {
          detail: { stats: this.stats, timestamp: new Date() },
        })
      );
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch stats';
      console.error('Error fetching dashboard stats:', err);

      // Try to load from cache if online request failed
      if (!this.stats && this.isOnline) {
        this.loadFromCache();
      }

      // Dispatch error event
      this.dispatchEvent(
        new CustomEvent('stats-error', {
          detail: { error: this.error, isOnline: this.isOnline },
        })
      );
    } finally {
      this.loading = false;
      this.render();
    }
  }

  private loadFromCache() {
    try {
      const cached = localStorage.getItem('dashboard-stats-cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;

        // Use cache if it's less than 30 minutes old
        if (age < 30 * 60 * 1000) {
          this.stats = data;
          this.lastFetchTime = timestamp;
          console.log('Loaded dashboard stats from cache');
        }
      }
    } catch (e) {
      console.warn('Failed to load cached stats:', e);
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  render() {
    if (this.loading) {
      this.innerHTML = SkeletonLoader.createStatsSkeleton();
      return;
    }

    if (this.error) {
      const isOffline = !this.isOnline;
      const canRetry = this.isOnline;

      this.innerHTML = `
        <div class="glass-panel p-6 rounded-xl border ${isOffline ? 'border-yellow-500/20' : 'border-red-500/20'}">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3 ${isOffline ? 'text-yellow-400' : 'text-red-400'}">
              <i class="fas ${isOffline ? 'fa-wifi-slash' : 'fa-exclamation-triangle'}"></i>
              <span>
                ${isOffline ? 'Offline - showing cached data' : 'Failed to load dashboard stats'}
                ${!this.stats ? '. Please try again.' : ''}
              </span>
            </div>
            ${
              canRetry
                ? `
              <button 
                onclick="this.closest('dashboard-stats').fetchStats(true)"
                class="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
              >
                <i class="fas fa-redo"></i> Retry
              </button>
            `
                : ''
            }
          </div>
          ${
            this.isOnline
              ? `
            <div class="text-xs text-gray-400 mt-2">
              Error: ${this.error}
            </div>
          `
              : ''
          }
        </div>
      `;
      return;
    }

    if (!this.stats) return;

    // Add connection status indicator
    const connectionIndicator = this.isOnline
      ? '<span class="w-2 h-2 bg-green-400 rounded-full inline-block mr-2"></span>'
      : '<span class="w-2 h-2 bg-yellow-400 rounded-full inline-block mr-2 animate-pulse"></span>';

    this.innerHTML = `
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-white flex items-center">
          ${connectionIndicator}
          Dashboard Overview
        </h2>
        <div class="text-xs text-gray-400">
          ${this.isOnline ? 'Live' : 'Offline'} • Updated ${this.formatRelativeTime(this.lastFetchTime)}
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Projects Stats -->
        <div class="glass-panel p-6 rounded-xl hover:bg-slate-800/60 transition-colors duration-300">
          <div class="flex items-center justify-between mb-4">
            <div class="p-3 bg-blue-500/20 rounded-lg">
              <i class="fas fa-project-diagram text-blue-400 text-xl"></i>
            </div>
            <span class="text-sm text-gray-400">Projects</span>
          </div>
          <div class="space-y-2">
            <div class="text-3xl font-bold text-white">${this.stats.projects.total}</div>
            <div class="flex items-center space-x-4 text-sm">
              <span class="text-green-400">${this.stats.projects.active} active</span>
              <span class="text-blue-400">${this.stats.projects.completed} done</span>
            </div>
            ${
              this.stats.projects.onHold > 0
                ? `
              <div class="text-xs text-yellow-400">
                <i class="fas fa-pause-circle"></i> ${this.stats.projects.onHold} on hold
              </div>
            `
                : ''
            }
          </div>
        </div>

        <!-- Tickets Stats -->
        <div class="glass-panel p-6 rounded-xl hover:bg-slate-800/60 transition-colors duration-300">
          <div class="flex items-center justify-between mb-4">
            <div class="p-3 bg-green-500/20 rounded-lg">
              <i class="fas fa-ticket-alt text-green-400 text-xl"></i>
            </div>
            <span class="text-sm text-gray-400">Tickets</span>
          </div>
          <div class="space-y-2">
            <div class="text-3xl font-bold text-white">${this.stats.tickets.total}</div>
            <div class="flex items-center space-x-4 text-sm">
              <span class="text-yellow-400">${this.stats.tickets.open} open</span>
              <span class="text-blue-400">${this.stats.tickets.inProgress} in progress</span>
            </div>
            ${
              this.stats.tickets.critical > 0
                ? `
              <div class="text-xs text-red-400 font-medium">
                <i class="fas fa-exclamation-triangle"></i> ${this.stats.tickets.critical} critical
              </div>
            `
                : ''
            }
            ${
              this.stats.tickets.highPriority > 0
                ? `
              <div class="text-xs text-orange-400">
                <i class="fas fa-flag"></i> ${this.stats.tickets.highPriority} high priority
              </div>
            `
                : ''
            }
          </div>
        </div>

        <!-- Invoices Stats -->
        <div class="glass-panel p-6 rounded-xl hover:bg-slate-800/60 transition-colors duration-300">
          <div class="flex items-center justify-between mb-4">
            <div class="p-3 bg-purple-500/20 rounded-lg">
              <i class="fas fa-file-invoice-dollar text-purple-400 text-xl"></i>
            </div>
            <span class="text-sm text-gray-400">Invoices</span>
          </div>
          <div class="space-y-2">
            <div class="text-3xl font-bold text-white">${this.stats.invoices.total}</div>
            <div class="flex items-center space-x-4 text-sm">
              <span class="text-yellow-400">${this.stats.invoices.pending} pending</span>
            </div>
            ${
              this.stats.invoices.overdue > 0
                ? `
              <div class="text-xs text-red-400 font-medium">
                <i class="fas fa-clock"></i> ${this.stats.invoices.overdue} overdue
              </div>
            `
                : ''
            }
            <div class="text-xs text-gray-400">
              Total: ${this.formatCurrency(this.stats.invoices.totalAmount)}
            </div>
            ${
              this.stats.invoices.pendingAmount > 0
                ? `
              <div class="text-xs text-yellow-400">
                Pending: ${this.formatCurrency(this.stats.invoices.pendingAmount)}
              </div>
            `
                : ''
            }
          </div>
        </div>

        <!-- Milestones Stats -->
        <div class="glass-panel p-6 rounded-xl hover:bg-slate-800/60 transition-colors duration-300">
          <div class="flex items-center justify-between mb-4">
            <div class="p-3 bg-yellow-500/20 rounded-lg">
              <i class="fas fa-flag-checkered text-yellow-400 text-xl"></i>
            </div>
            <span class="text-sm text-gray-400">Milestones</span>
          </div>
          <div class="space-y-2">
            <div class="text-3xl font-bold text-white">${this.stats.milestones.total}</div>
            <div class="flex items-center space-x-4 text-sm">
              <span class="text-green-400">${this.stats.milestones.completed} done</span>
            </div>
            ${
              this.stats.milestones.dueThisWeek > 0
                ? `
              <div class="text-xs text-blue-400">
                <i class="fas fa-calendar-week"></i> ${this.stats.milestones.dueThisWeek} this week
              </div>
            `
                : ''
            }
            ${
              this.stats.milestones.overdue > 0
                ? `
              <div class="text-xs text-red-400 font-medium">
                <i class="fas fa-exclamation-triangle"></i> ${this.stats.milestones.overdue} overdue
              </div>
            `
                : ''
            }
          </div>
        </div>
      </div>
    `;
  }
}

formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatRelativeTime(timestamp: number): string {
    if (!timestamp) return 'never';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }
}

customElements.define('dashboard-stats', DashboardStatsComponent);
