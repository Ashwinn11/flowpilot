export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  [key: string]: any;
}

class Logger {
  private logLevel: LogLevel;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logLevel = this.isProduction ? LogLevel.INFO : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: string, message: string, context?: LogContext, error?: Error): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(this.sanitizeContext(context))}` : '';
    const errorStr = error ? ` | Error: ${this.sanitizeError(error)}` : '';
    
    return `[${timestamp}] ${level}: ${message}${contextStr}${errorStr}`;
  }

  private sanitizeContext(context: LogContext): Partial<LogContext> {
    const sanitized = { ...context };
    
    // Remove sensitive information in production
    if (this.isProduction) {
      delete sanitized.email;
      delete sanitized.password;
      delete sanitized.token;
      delete sanitized.accessToken;
      delete sanitized.refreshToken;
      delete sanitized.userAgent;
      delete sanitized.ip;
      
      // Only keep non-sensitive user info
      if (sanitized.userId) {
        sanitized.userId = sanitized.userId.substring(0, 8) + '...';
      }
    }
    
    return sanitized;
  }

  private sanitizeError(error: Error): string {
    // Always mask stack traces in user-facing responses
    return error.message || 'Unknown error';
  }

  private log(level: LogLevel, levelName: string, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(levelName, message, context, error);
    
    switch (level) {
      case LogLevel.DEBUG:
        if (!this.isProduction) {
          console.log(formattedMessage);
        }
        break;
      case LogLevel.INFO:
        console.log(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage);
        break;
    }

    // TODO: Send to external logging service in production
    // if (this.isProduction && level >= LogLevel.ERROR) {
    //   this.sendToExternalService(level, message, context, error);
    // }
  }

  debug(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, context, error);
  }

  info(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.INFO, 'INFO', message, context, error);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.WARN, 'WARN', message, context, error);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, 'ERROR', message, context, error);
  }

  fatal(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.FATAL, 'FATAL', message, context, error);
  }

  // Security-specific logging methods
  securityEvent(event: string, context?: LogContext): void {
    this.warn(`SECURITY: ${event}`, context);
  }

  authEvent(event: string, context?: LogContext): void {
    this.info(`AUTH: ${event}`, context);
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext): void {
    if (duration > 1000) { // Log slow operations (>1s)
      this.warn(`PERFORMANCE: ${operation} took ${duration}ms`, context);
    } else if (!this.isProduction) {
      this.debug(`PERFORMANCE: ${operation} took ${duration}ms`, context);
    }
  }

  // Request logging
  request(method: string, url: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    const message = `REQUEST: ${method} ${url} - ${statusCode} (${duration}ms)`;
    this.log(level, level === LogLevel.WARN ? 'WARN' : 'INFO', message, context);
  }

  // Set log level
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  // Get current log level
  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  // Check if production mode
  isProd(): boolean {
    return this.isProduction;
  }
}

export const logger = new Logger(); 