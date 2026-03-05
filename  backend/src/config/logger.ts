/**
 * Logger Configuration
 *
 * Creates and exports a singleton Winston logger instance used across the
 * entire application for structured, levelled logging.
 *
 * Log levels:
 * - **production**: `info` and above (warn, error) are recorded; debug/verbose
 *   messages are suppressed to keep logs lean in production environments.
 * - **development / test**: `debug` and above are recorded so developers can
 *   see detailed query traces and application internals.
 *
 * Transports:
 * - `logs/error.log`    – error-level messages only.
 * - `logs/combined.log` – all messages at the configured level and above.
 * - **Console** (non-production only) – colourised, human-readable output.
 *
 * Every log entry includes a timestamp and the service name `news-api` as
 * default metadata, making it easy to filter entries in aggregated log
 * pipelines.
 */
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'news-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;
