/// <reference types="../types/dashboard.d.ts" />

// Enhanced dashboard functionality with real-time updates
let refreshInterval: NodeJS.Timeout | undefined;
let realtimeEnabled = true;

function startAutoRefresh() {
  refreshInterval = setInterval(() => {
    if (!realtimeEnabled) {
      refreshData();
    }
  }, 30000); // Refresh every 30 seconds when real-time is disabled
}

function refreshData() {
  const refreshBtn = document.getElementById('refreshBtn');
  const icon = refreshBtn?.querySelector('i');

  // Add spinning animation
  icon?.classList.add('fa-spin');

  // Use real-time refresh if available and enabled
  if (realtimeEnabled && window.notificationService) {
    window.notificationService.refreshDashboardStats();
  } else {
    // Fallback to HTTP refresh
    window.dispatchEvent(new CustomEvent('refresh-dashboard'));
  }

  // Remove spinning animation after 1 second
  setTimeout(() => {
    icon?.classList.remove('fa-spin');
  }, 1000);
}

function updateConnectionStatus(connected: boolean) {
  const indicator = document.getElementById('statusIndicator');
  const text = document.getElementById('statusText');
  const toggle = document.getElementById('realtimeToggle');

  if (connected) {
    indicator?.classList.remove('bg-gray-500', 'bg-red-500');
    indicator?.classList.add('bg-green-500');
    if (text) text.textContent = 'Connected';
    if (toggle) {
      toggle.classList.remove('bg-gray-600');
      toggle.classList.add('bg-green-600');
    }
  } else {
    indicator?.classList.remove('bg-green-500', 'bg-gray-500');
    indicator?.classList.add('bg-red-500');
    if (text) text.textContent = 'Disconnected';
    if (toggle) {
      toggle.classList.remove('bg-green-600');
      toggle.classList.add('bg-gray-600');
    }
  }
}

function toggleRealtime() {
  realtimeEnabled = !realtimeEnabled;
  const toggle = document.getElementById('realtimeToggle');
  const icon = toggle?.querySelector('i');

  if (realtimeEnabled) {
    if (toggle) {
      toggle.classList.remove('bg-gray-600');
      toggle.classList.add('bg-green-600');
    }
    if (icon) icon.classList.remove('fa-pause');
    if (icon) icon.classList.add('fa-bolt');

    // Reconnect notification service
    if (window.notificationService) {
      window.notificationService.reconnect();
    }
  } else {
    if (toggle) {
      toggle.classList.remove('bg-green-600');
      toggle.classList.add('bg-gray-600');
    }
    if (icon) icon.classList.remove('fa-bolt');
    if (icon) icon.classList.add('fa-pause');
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  startAutoRefresh();

  // Set up real-time connection monitoring
  if (window.notificationService) {
    // Update connection status
    const checkConnection = () => {
      const status = window.notificationService?.getDashboardConnectionStatus();
      if (status) {
        updateConnectionStatus(status.connected);
      }
    };

    // Check connection status periodically
    setInterval(checkConnection, 5000);
    checkConnection(); // Initial check

    // Listen to notification service events
    window.notificationService?.on({
      onConnect: () => updateConnectionStatus(true),
      onDisconnect: () => updateConnectionStatus(false),
      onError: () => updateConnectionStatus(false),
      onRealtimeNotification: (notification: any) => {
        console.log('Real-time notification:', notification);
      },
    });
  }

  // Manual refresh button handler
  document.getElementById('refreshBtn')?.addEventListener('click', refreshData);

  // Real-time toggle handler
  document
    .getElementById('realtimeToggle')
    ?.addEventListener('click', toggleRealtime);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  // Disconnect notification service
  window.notificationService?.disconnect();
});
