/**
 * Lightweight logger for FOUR Trading SDK
 * Provides configurable logging without external dependencies
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  timestamp?: boolean;
}

export class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level ?? LogLevel.INFO,
      prefix: config.prefix ?? '[FourTrading]',
      timestamp: config.timestamp ?? true,
    };
  }

  private formatMessage(level: string, message: string, meta?: Record<string, unknown>): string {
    const parts: string[] = [];

    if (this.config.timestamp) {
      parts.push(new Date().toISOString());
    }

    parts.push(this.config.prefix!);
    parts.push(`[${level}]`);
    parts.push(message);

    if (meta && Object.keys(meta).length > 0) {
      parts.push(JSON.stringify(meta));
    }

    return parts.join(' ');
  }

  private log(level: LogLevel, levelName: string, message: string, meta?: Record<string, unknown>): void {
    if (level < this.config.level) {
      return;
    }

    const formatted = this.formatMessage(levelName, message, meta);

    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, 'INFO', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, 'WARN', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, 'ERROR', message, meta);
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  getLevel(): LogLevel {
    return this.config.level;
  }
}

// Export singleton instance with default config
export const defaultLogger = new Logger();
