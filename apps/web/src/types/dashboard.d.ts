// Global type declarations for dashboard
declare global {
  interface Window {
    notificationService?: {
      refreshDashboardStats: () => void;
      reconnect: () => void;
      getDashboardConnectionStatus: () => { connected: boolean };
      on: (callbacks: any) => void;
      disconnect: () => void;
    };
  }
}

export {};
