// Real-time data synchronization using Server-Sent Events
import { API_CONFIG } from '../config/api.js';

export class RealtimeService {
  private eventSource: EventSource | null = null;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor() {
    this.setupOfflineDetection();
  }

  // Subscribe to real-time updates for a specific event type
  subscribe(eventType: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }

    this.subscribers.get(eventType)!.add(callback);

    // Start connection if not already connected
    if (!this.eventSource && !this.isConnecting) {
      this.connect();
    }

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(eventType);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(eventType);
        }
      }

      // Disconnect if no subscribers left
      if (this.subscribers.size === 0 && this.eventSource) {
        this.disconnect();
      }
    };
  }

  private connect() {
    if (this.isConnecting || this.eventSource) return;

    this.isConnecting = true;

    try {
      const url = `${API_CONFIG.BACKEND_URL}/api/realtime/events`;
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        console.log('Realtime connection established');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;

        // Notify subscribers of connection
        this.notifySubscribers('connection', { status: 'connected' });
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifySubscribers(data.type, data.payload);
        } catch (error) {
          console.error('Error parsing realtime message:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('Realtime connection error:', error);
        this.isConnecting = false;

        // Notify subscribers of disconnection
        this.notifySubscribers('connection', { status: 'disconnected', error });

        // Attempt reconnection
        this.attemptReconnect();
      };

      // Handle specific event types
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create EventSource:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  private setupEventHandlers() {
    if (!this.eventSource) return;

    // Dashboard updates
    this.eventSource.addEventListener('dashboard-update', (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifySubscribers('dashboard-update', data);
      } catch (error) {
        console.error('Error parsing dashboard update:', error);
      }
    });

    // Project updates
    this.eventSource.addEventListener('project-update', (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifySubscribers('project-update', data);
      } catch (error) {
        console.error('Error parsing project update:', error);
      }
    });

    // Ticket updates
    this.eventSource.addEventListener('ticket-update', (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifySubscribers('ticket-update', data);
      } catch (error) {
        console.error('Error parsing ticket update:', error);
      }
    });

    // Invoice updates
    this.eventSource.addEventListener('invoice-update', (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifySubscribers('invoice-update', data);
      } catch (error) {
        console.error('Error parsing invoice update:', error);
      }
    });
  }

  private notifySubscribers(eventType: string, data: any) {
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      subscribers.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(
            `Error in subscriber callback for ${eventType}:`,
            error
          );
        }
      });
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;

    setTimeout(() => {
      console.log(
        `Attempting reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }

  private disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnecting = false;
  }

  private setupOfflineDetection() {
    window.addEventListener('online', () => {
      console.log('Network connection restored');
      if (!this.eventSource && this.subscribers.size > 0) {
        this.connect();
      }
    });

    window.addEventListener('offline', () => {
      console.log('Network connection lost');
      this.notifySubscribers('connection', { status: 'offline' });
    });
  }

  // Public method to manually trigger refresh
  refresh() {
    this.notifySubscribers('refresh', { timestamp: Date.now() });
  }

  // Cleanup method
  destroy() {
    this.disconnect();
    this.subscribers.clear();
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();
