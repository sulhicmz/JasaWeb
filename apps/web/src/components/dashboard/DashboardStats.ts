// Dashboard Stats Component
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

  connectedCallback() {
    this.render();
    this.fetchStats();

    // Listen for refresh events
    window.addEventListener('refresh-dashboard', () => {
      this.fetchStats();
    });
  }

  async fetchStats() {
    this.loading = true;
    this.error = null;
    this.render();

    try {
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Cache-Control': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.stats = await response.json();

      // Dispatch success event for parent components
      this.dispatchEvent(
        new CustomEvent('stats-updated', {
          detail: { stats: this.stats, timestamp: new Date() },
        })
      );
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch stats';
      console.error('Error fetching dashboard stats:', err);

      // Dispatch error event
      this.dispatchEvent(
        new CustomEvent('stats-error', {
          detail: { error: this.error },
        })
      );
    } finally {
      this.loading = false;
      this.render();
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
      this.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          ${Array.from(
            { length: 4 },
            () => `
            <div class="glass-panel p-6 rounded-xl animate-pulse">
              <div class="h-4 bg-slate-700 rounded mb-4 w-1/2"></div>
              <div class="h-8 bg-slate-700 rounded mb-2"></div>
              <div class="h-3 bg-slate-700 rounded w-3/4"></div>
            </div>
          `
          ).join('')}
        </div>
      `;
      return;
    }

    if (this.error) {
      this.innerHTML = `
        <div class="glass-panel p-6 rounded-xl border border-red-500/20">
          <div class="flex items-center space-x-3 text-red-400">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Failed to load dashboard stats. Please try again.</span>
          </div>
        </div>
      `;
      return;
    }

    if (!this.stats) return;

    this.innerHTML = `
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

customElements.define('dashboard-stats', DashboardStatsComponent);
