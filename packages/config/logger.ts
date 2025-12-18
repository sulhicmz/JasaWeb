interface LogLevel {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  private static instance: Logger;
  private currentLevel: number = LOG_LEVELS.INFO;
  private isDevelopment: boolean = process.env.NODE_ENV === 'development';

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: number): boolean {
    return this.isDevelopment && level >= this.currentLevel;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      // Use dev-only logging
      if (this.isDevelopment) {
        console.debug(this.formatMessage('DEBUG', message, data));
      }
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      if (this.isDevelopment) {
        console.info(this.formatMessage('INFO', message, data));
      }
      // In production, could send to a logging service
      this.sendToLogService('INFO', message, data);
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      if (this.isDevelopment) {
        console.warn(this.formatMessage('WARN', message, data));
      }
      this.sendToLogService('WARN', message, data);
    }
  }

  error(message: string, error?: Error | any): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      if (this.isDevelopment) {
        console.error(this.formatMessage('ERROR', message, error));
      }
      this.sendToLogService('ERROR', message, error);
    }
  }

  private sendToLogService(level: string, message: string, data?: any): void {
    // In production, send to centralized logging service
    // For now, we'll use a noop for production logs
    if (this.isDevelopment) return;

    // Production logging service integration
    // Example: Sentry, LogRocket, or custom logging endpoint
    // This should be implemented when deploying to production
  }

  // Performance-specific logging
  performance(metric: string, value: number, details?: any): void {
    this.info(`Performance: ${metric}`, { value, ...details });
  }

  // Security-specific logging
  security(event: string, details?: any): void {
    this.warn(`Security Event: ${event}`, details);
  }

  // Audit logging for security events
  audit(action: string, userId?: string, details?: any): void {
    this.info(`Audit: ${action}`, {
      userId,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }
}

export const logger = Logger.getInstance();
export default logger;
