// Logger module for HyVornBot
// Created by ImVylo

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

// Log levels
const levels = {
  DEBUG: { priority: 0, color: colors.gray, label: 'DEBUG' },
  INFO: { priority: 1, color: colors.cyan, label: 'INFO' },
  SUCCESS: { priority: 2, color: colors.green, label: 'SUCCESS' },
  WARN: { priority: 3, color: colors.yellow, label: 'WARN' },
  ERROR: { priority: 4, color: colors.red, label: 'ERROR' },
  FATAL: { priority: 5, color: colors.red + colors.bright, label: 'FATAL' }
};

class Logger {
  constructor(options = {}) {
    this.options = {
      logToFile: options.logToFile ?? true,
      logToConsole: options.logToConsole ?? true,
      minLevel: options.minLevel ?? 'DEBUG',
      maxFileSize: options.maxFileSize ?? 5 * 1024 * 1024, // 5MB
      maxFiles: options.maxFiles ?? 5
    };

    this.currentLogFile = this.getLogFilePath();
  }

  /**
   * Get current log file path
   */
  getLogFilePath() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(logsDir, `${date}.log`);
  }

  /**
   * Format timestamp
   */
  formatTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format log message for console
   */
  formatConsole(level, module, message) {
    const levelInfo = levels[level];
    const timestamp = this.formatTimestamp();
    const moduleStr = module ? `[${module}]` : '';

    return `${colors.gray}${timestamp}${colors.reset} ${levelInfo.color}${levelInfo.label.padEnd(7)}${colors.reset} ${colors.magenta}${moduleStr.padEnd(15)}${colors.reset} ${message}`;
  }

  /**
   * Format log message for file
   */
  formatFile(level, module, message) {
    const timestamp = this.formatTimestamp();
    const moduleStr = module ? `[${module}]` : '';
    return `${timestamp} ${level.padEnd(7)} ${moduleStr.padEnd(15)} ${message}`;
  }

  /**
   * Write to log file
   */
  writeToFile(formattedMessage) {
    if (!this.options.logToFile) return;

    try {
      // Update log file path if date changed
      const newPath = this.getLogFilePath();
      if (newPath !== this.currentLogFile) {
        this.currentLogFile = newPath;
      }

      // Check file size and rotate if needed
      this.rotateIfNeeded();

      fs.appendFileSync(this.currentLogFile, formattedMessage + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Rotate log files if current file is too large
   */
  rotateIfNeeded() {
    try {
      if (!fs.existsSync(this.currentLogFile)) return;

      const stats = fs.statSync(this.currentLogFile);
      if (stats.size < this.options.maxFileSize) return;

      // Rotate files
      for (let i = this.options.maxFiles - 1; i >= 1; i--) {
        const oldPath = `${this.currentLogFile}.${i}`;
        const newPath = `${this.currentLogFile}.${i + 1}`;
        if (fs.existsSync(oldPath)) {
          if (i === this.options.maxFiles - 1) {
            fs.unlinkSync(oldPath);
          } else {
            fs.renameSync(oldPath, newPath);
          }
        }
      }

      fs.renameSync(this.currentLogFile, `${this.currentLogFile}.1`);
    } catch (error) {
      console.error('Failed to rotate log files:', error);
    }
  }

  /**
   * Main log function
   */
  log(level, module, message, ...args) {
    const levelInfo = levels[level];
    const minLevelInfo = levels[this.options.minLevel];

    if (levelInfo.priority < minLevelInfo.priority) return;

    // Format message with arguments
    let formattedMessage = message;
    if (args.length > 0) {
      formattedMessage = message + ' ' + args.map(arg => {
        if (typeof arg === 'object') {
          return JSON.stringify(arg, null, 2);
        }
        return String(arg);
      }).join(' ');
    }

    // Console output
    if (this.options.logToConsole) {
      console.log(this.formatConsole(level, module, formattedMessage));
    }

    // File output
    this.writeToFile(this.formatFile(level, module, formattedMessage));
  }

  // Convenience methods
  debug(module, message, ...args) {
    this.log('DEBUG', module, message, ...args);
  }

  info(module, message, ...args) {
    this.log('INFO', module, message, ...args);
  }

  success(module, message, ...args) {
    this.log('SUCCESS', module, message, ...args);
  }

  warn(module, message, ...args) {
    this.log('WARN', module, message, ...args);
  }

  error(module, message, ...args) {
    this.log('ERROR', module, message, ...args);
  }

  fatal(module, message, ...args) {
    this.log('FATAL', module, message, ...args);
  }

  /**
   * Create a child logger with a fixed module name
   */
  child(module) {
    const parent = this;
    return {
      debug: (message, ...args) => parent.debug(module, message, ...args),
      info: (message, ...args) => parent.info(module, message, ...args),
      success: (message, ...args) => parent.success(module, message, ...args),
      warn: (message, ...args) => parent.warn(module, message, ...args),
      error: (message, ...args) => parent.error(module, message, ...args),
      fatal: (message, ...args) => parent.fatal(module, message, ...args)
    };
  }
}

// Export singleton instance
const logger = new Logger();
export default logger;
export { Logger };
