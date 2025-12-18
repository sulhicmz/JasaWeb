"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};
class Logger {
    static instance;
    currentLevel = LOG_LEVELS.INFO;
    isDevelopment = process.env.NODE_ENV === 'development';
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    shouldLog(level) {
        return this.isDevelopment && level >= this.currentLevel;
    }
    formatMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        const dataStr = data ? ` ${JSON.stringify(data)}` : '';
        return `[${timestamp}] [${level}] ${message}${dataStr}`;
    }
    debug(message, data) {
        if (this.shouldLog(LOG_LEVELS.DEBUG)) {
            if (this.isDevelopment) {
                console.debug(this.formatMessage('DEBUG', message, data));
            }
        }
    }
    info(message, data) {
        if (this.shouldLog(LOG_LEVELS.INFO)) {
            if (this.isDevelopment) {
                console.info(this.formatMessage('INFO', message, data));
            }
            this.sendToLogService('INFO', message, data);
        }
    }
    warn(message, data) {
        if (this.shouldLog(LOG_LEVELS.WARN)) {
            if (this.isDevelopment) {
                console.warn(this.formatMessage('WARN', message, data));
            }
            this.sendToLogService('WARN', message, data);
        }
    }
    error(message, error) {
        if (this.shouldLog(LOG_LEVELS.ERROR)) {
            if (this.isDevelopment) {
                console.error(this.formatMessage('ERROR', message, error));
            }
            this.sendToLogService('ERROR', message, error);
        }
    }
    sendToLogService(_level, _message, _data) {
        if (this.isDevelopment)
            return;
    }
    performance(metric, value, details) {
        this.info(`Performance: ${metric}`, { value, ...details });
    }
    security(event, details) {
        this.warn(`Security Event: ${event}`, details);
    }
    audit(action, userId, details) {
        this.info(`Audit: ${action}`, {
            userId,
            timestamp: new Date().toISOString(),
            ...details,
        });
    }
}
exports.logger = Logger.getInstance();
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map