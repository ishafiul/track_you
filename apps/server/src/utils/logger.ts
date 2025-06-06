import {Context} from 'hono';

export enum LogSeverity {
  INFO = 'info',
  DEBUG = 'debug',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// ANSI escape codes for colors
const COLORS = {
  RESET: '\x1b[0m',
  INFO: '\x1b[34m',    // Blue
  DEBUG: '\x1b[32m',   // Green
  WARN: '\x1b[33m',    // Yellow
  ERROR: '\x1b[31m',   // Red
  FATAL: '\x1b[41m\x1b[37m' // Red background with white text
};

export class Logger {
  private _serviceName: string;

  constructor(serviceName: string) {
    this._serviceName = serviceName;
  }

  private _getColor(severity: LogSeverity): string {
    switch (severity) {
      case LogSeverity.INFO:
        return COLORS.INFO;
      case LogSeverity.DEBUG:
        return COLORS.DEBUG;
      case LogSeverity.WARN:
        return COLORS.WARN;
      case LogSeverity.ERROR:
        return COLORS.ERROR;
      case LogSeverity.FATAL:
        return COLORS.FATAL;
      default:
        return COLORS.RESET;
    }
  }

  log(severity: LogSeverity, message: string, data?: Record<string, any>, error?: Error) {
    const timestamp = new Date();
    const color = this._getColor(severity);
    const reset = COLORS.RESET;
    let logMessage = `${color}${severity.toUpperCase()} (${this._serviceName}): ${message}${reset}`;

    if (data) {
      logMessage += `\nData: ${JSON.stringify(data, null, 2)}`;
    }

    if (error) {
      logMessage += `\nError Trace: ${error}`;
    }

    console.log(`[${timestamp.toISOString()}] ${logMessage}`);
  }

  info(message: string, data?: Record<string, any>) {
    this.log(LogSeverity.INFO, message, data);
  }

  debug(message: string, data?: Record<string, any>) {
    this.log(LogSeverity.DEBUG, message, data);
  }

  warn(message: string, data?: Record<string, any>) {
    this.log(LogSeverity.WARN, message, data);
  }

  error(message: string, data?: Record<string, any>, error?: Error) {
    this.log(LogSeverity.ERROR, message, data, error);
  }

  fatal(message: string, data?: Record<string, any>, error?: Error) {
    this.log(LogSeverity.FATAL, message, data, error);
  }
}
