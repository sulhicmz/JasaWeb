// Enhanced Skeleton Loading Components
export class SkeletonLoader {
  static createStatsSkeleton(): string {
    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        ${Array.from({ length: 4 }, (_, i) => this.createStatCardSkeleton(i)).join('')}
      </div>
    `;
  }

  static createStatCardSkeleton(index: number): string {
    const delays = [
      'animation-delay-0',
      'animation-delay-100',
      'animation-delay-200',
      'animation-delay-300',
    ];
    return `
      <div class="glass-panel p-6 rounded-xl">
        <div class="flex items-center justify-between mb-4">
          <div class="p-3 bg-slate-700 rounded-lg animate-pulse ${delays[index]}">
            <div class="w-5 h-5 bg-slate-600 rounded"></div>
          </div>
          <div class="h-4 bg-slate-700 rounded w-12 animate-pulse ${delays[index]}"></div>
        </div>
        <div class="space-y-2">
          <div class="h-8 bg-slate-700 rounded animate-pulse ${delays[index]}"></div>
          <div class="flex space-x-4">
            <div class="h-3 bg-slate-700 rounded w-16 animate-pulse ${delays[index]}"></div>
            <div class="h-3 bg-slate-700 rounded w-16 animate-pulse ${delays[index]}"></div>
          </div>
          <div class="h-3 bg-slate-700 rounded w-24 animate-pulse ${delays[index]}"></div>
        </div>
      </div>
    `;
  }

  static createActivitySkeleton(): string {
    return `
      <div class="glass-panel p-6 rounded-xl">
        <div class="flex items-center justify-between mb-6">
          <div class="h-6 bg-slate-700 rounded w-32 animate-pulse"></div>
          <div class="h-8 bg-slate-700 rounded w-20 animate-pulse"></div>
        </div>
        <div class="space-y-4">
          ${Array.from({ length: 5 }, (_, i) => this.createActivityItemSkeleton(i)).join('')}
        </div>
      </div>
    `;
  }

  static createActivityItemSkeleton(index: number): string {
    const delays = [
      'animation-delay-0',
      'animation-delay-100',
      'animation-delay-200',
      'animation-delay-300',
      'animation-delay-400',
    ];
    return `
      <div class="flex items-center space-x-4 p-3 rounded-lg hover:bg-slate-800/30 transition-colors">
        <div class="w-10 h-10 bg-slate-700 rounded-full animate-pulse ${delays[index]}"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-slate-700 rounded w-3/4 animate-pulse ${delays[index]}"></div>
          <div class="h-3 bg-slate-700 rounded w-1/2 animate-pulse ${delays[index]}"></div>
        </div>
        <div class="text-right">
          <div class="h-3 bg-slate-700 rounded w-16 animate-pulse ${delays[index]}"></div>
        </div>
      </div>
    `;
  }

  static createProjectsSkeleton(): string {
    return `
      <div class="glass-panel p-6 rounded-xl">
        <div class="flex items-center justify-between mb-6">
          <div class="h-6 bg-slate-700 rounded w-32 animate-pulse"></div>
          <div class="h-8 bg-slate-700 rounded w-24 animate-pulse"></div>
        </div>
        <div class="space-y-4">
          ${Array.from({ length: 3 }, (_, i) => this.createProjectCardSkeleton(i)).join('')}
        </div>
      </div>
    `;
  }

  static createProjectCardSkeleton(index: number): string {
    const delays = [
      'animation-delay-0',
      'animation-delay-150',
      'animation-delay-300',
    ];
    return `
      <div class="border border-slate-700 rounded-lg p-4 hover:bg-slate-800/30 transition-colors">
        <div class="flex items-start justify-between mb-3">
          <div class="space-y-2">
            <div class="h-5 bg-slate-700 rounded w-32 animate-pulse ${delays[index]}"></div>
            <div class="h-3 bg-slate-700 rounded w-24 animate-pulse ${delays[index]}"></div>
          </div>
          <div class="h-6 bg-slate-700 rounded w-16 animate-pulse ${delays[index]}"></div>
        </div>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="h-2 bg-slate-700 rounded-full w-full animate-pulse ${delays[index]}"></div>
            <div class="h-3 bg-slate-700 rounded w-8 ml-2 animate-pulse ${delays[index]}"></div>
          </div>
          <div class="flex items-center space-x-4 text-sm">
            <div class="h-3 bg-slate-700 rounded w-12 animate-pulse ${delays[index]}"></div>
            <div class="h-3 bg-slate-700 rounded w-16 animate-pulse ${delays[index]}"></div>
            <div class="h-3 bg-slate-700 rounded w-14 animate-pulse ${delays[index]}"></div>
          </div>
        </div>
      </div>
    `;
  }

  static createChartSkeleton(): string {
    return `
      <div class="glass-panel p-6 rounded-xl">
        <div class="flex items-center justify-between mb-6">
          <div class="h-6 bg-slate-700 rounded w-32 animate-pulse"></div>
          <div class="flex space-x-2">
            ${Array.from(
              { length: 3 },
              (_, i) => `
              <div class="h-8 bg-slate-700 rounded w-20 animate-pulse animation-delay-${i * 100}"></div>
            `
            ).join('')}
          </div>
        </div>
        <div class="h-64 bg-slate-700 rounded-lg animate-pulse flex items-center justify-center">
          <div class="text-slate-500">
            <i class="fas fa-chart-line text-4xl mb-2"></i>
            <p class="text-sm">Loading chart data...</p>
          </div>
        </div>
      </div>
    `;
  }

  static createTableSkeleton(rows: number = 5): string {
    return `
      <div class="glass-panel rounded-xl overflow-hidden">
        <div class="border-b border-slate-700 p-4">
          <div class="h-6 bg-slate-700 rounded w-32 animate-pulse"></div>
        </div>
        <div class="divide-y divide-slate-700">
          ${Array.from(
            { length: rows },
            (_, i) => `
            <div class="p-4 flex items-center space-x-4">
              <div class="h-4 bg-slate-700 rounded w-8 animate-pulse animation-delay-${i * 50}"></div>
              <div class="h-4 bg-slate-700 rounded w-1/3 animate-pulse animation-delay-${i * 50}"></div>
              <div class="h-4 bg-slate-700 rounded w-1/4 animate-pulse animation-delay-${i * 50}"></div>
              <div class="h-4 bg-slate-700 rounded w-20 animate-pulse animation-delay-${i * 50}"></div>
            </div>
          `
          ).join('')}
        </div>
      </div>
    `;
  }
}

// Add CSS animations for skeleton loading
const skeletonStyles = `
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
  
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  .animation-delay-0 { animation-delay: 0ms; }
  .animation-delay-50 { animation-delay: 50ms; }
  .animation-delay-100 { animation-delay: 100ms; }
  .animation-delay-150 { animation-delay: 150ms; }
  .animation-delay-200 { animation-delay: 200ms; }
  .animation-delay-300 { animation-delay: 300ms; }
  .animation-delay-400 { animation-delay: 400ms; }
`;

// Inject styles if not already present
if (!document.getElementById('skeleton-styles')) {
  const style = document.createElement('style');
  style.id = 'skeleton-styles';
  style.textContent = skeletonStyles;
  document.head.appendChild(style);
}
