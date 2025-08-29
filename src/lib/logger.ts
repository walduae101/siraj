// Structured Logger for Siraj
// Provides consistent logging with request correlation, user context, and severity levels

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  responseTime?: number;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  category: string;
  type: string;
  context: LogContext;
  error?: Error;
}

class Logger {
  private requestId: string | undefined;
  private userId: string | undefined;
  private sessionId: string | undefined;

  constructor() {
    this.requestId = undefined;
    this.userId = undefined;
    this.sessionId = undefined;
  }

  // Set request context for correlation
  setRequestContext(context: Partial<LogContext>) {
    this.requestId = context.requestId;
    this.userId = context.userId;
    this.sessionId = context.sessionId;
  }

  // Clear request context
  clearRequestContext() {
    this.requestId = undefined;
    this.userId = undefined;
    this.sessionId = undefined;
  }

  // Generate request ID if not provided
  private generateRequestId(): string {
    return crypto.randomUUID();
  }

  // Format log entry for structured logging
  private formatLogEntry(
    level: LogLevel,
    message: string,
    category: string,
    type: string,
    context: LogContext = {},
    error?: Error,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      category,
      type,
      context: {
        requestId: this.requestId || this.generateRequestId(),
        userId: this.userId,
        sessionId: this.sessionId,
        ...context,
      },
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };
  }

  // Log methods
  debug(message: string, category: string, type: string, context?: LogContext) {
    const entry = this.formatLogEntry(
      "DEBUG",
      message,
      category,
      type,
      context,
    );
    console.debug(JSON.stringify(entry));
  }

  info(message: string, category: string, type: string, context?: LogContext) {
    const entry = this.formatLogEntry("INFO", message, category, type, context);
    console.info(JSON.stringify(entry));
  }

  warn(message: string, category: string, type: string, context?: LogContext) {
    const entry = this.formatLogEntry("WARN", message, category, type, context);
    console.warn(JSON.stringify(entry));
  }

  error(
    message: string,
    category: string,
    type: string,
    context?: LogContext,
    error?: Error,
  ) {
    const entry = this.formatLogEntry(
      "ERROR",
      message,
      category,
      type,
      context,
      error,
    );
    console.error(JSON.stringify(entry));
  }

  fatal(
    message: string,
    category: string,
    type: string,
    context?: LogContext,
    error?: Error,
  ) {
    const entry = this.formatLogEntry(
      "FATAL",
      message,
      category,
      type,
      context,
      error,
    );
    console.error(JSON.stringify(entry));
  }

  // Convenience methods for common categories
  auth(message: string, type: string, context?: LogContext) {
    this.info(message, "authentication", type, context);
  }

  authError(
    message: string,
    type: string,
    context?: LogContext,
    error?: Error,
  ) {
    this.error(message, "authentication", type, context, error);
  }

  payment(message: string, type: string, context?: LogContext) {
    this.info(message, "payment", type, context);
  }

  paymentError(
    message: string,
    type: string,
    context?: LogContext,
    error?: Error,
  ) {
    this.error(message, "payment", type, context, error);
  }

  security(message: string, type: string, context?: LogContext) {
    this.warn(message, "security", type, context);
  }

  securityError(
    message: string,
    type: string,
    context?: LogContext,
    error?: Error,
  ) {
    this.error(message, "security", type, context, error);
  }

  performance(message: string, type: string, context?: LogContext) {
    this.info(message, "performance", type, context);
  }

  performanceError(
    message: string,
    type: string,
    context?: LogContext,
    error?: Error,
  ) {
    this.error(message, "performance", type, context, error);
  }

  business(message: string, type: string, context?: LogContext) {
    this.info(message, "business", type, context);
  }

  businessError(
    message: string,
    type: string,
    context?: LogContext,
    error?: Error,
  ) {
    this.error(message, "business", type, context, error);
  }

  // Request logging
  requestStart(method: string, path: string, context?: LogContext) {
    this.info(`Request started: ${method} ${path}`, "request", "start", {
      method,
      path,
      ...context,
    });
  }

  requestEnd(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
    context?: LogContext,
  ) {
    const level = statusCode >= 400 ? "ERROR" : "INFO";
    const message = `Request completed: ${method} ${path} - ${statusCode} (${responseTime}ms)`;

    if (level === "ERROR") {
      this.error(message, "request", "end", {
        method,
        path,
        statusCode,
        responseTime,
        ...context,
      });
    } else {
      this.info(message, "request", "end", {
        method,
        path,
        statusCode,
        responseTime,
        ...context,
      });
    }
  }

  // Error logging with automatic categorization
  logError(error: Error, context?: LogContext) {
    let category = "application";
    let type = "unknown_error";

    // Categorize errors based on error type or message
    if (error.name === "FirebaseError") {
      category = "firebase";
      type = "firebase_error";
    } else if (
      error.message.includes("auth") ||
      error.message.includes("token")
    ) {
      category = "authentication";
      type = "auth_error";
    } else if (
      error.message.includes("payment") ||
      error.message.includes("webhook")
    ) {
      category = "payment";
      type = "payment_error";
    } else if (
      error.message.includes("network") ||
      error.message.includes("fetch")
    ) {
      category = "network";
      type = "network_error";
    } else if (
      error.message.includes("validation") ||
      error.message.includes("invalid")
    ) {
      category = "validation";
      type = "validation_error";
    }

    this.error(error.message, category, type, context, error);
  }
}

// Create singleton instance
const logger = new Logger();

// Export logger instance and types
export { logger };
export default logger;

// Middleware helper for Next.js
export function createRequestLogger(
  requestId?: string,
  userId?: string,
  sessionId?: string,
) {
  logger.setRequestContext({ requestId, userId, sessionId });
  return logger;
}

// Utility function to sanitize sensitive data
export function sanitizeContext(context: LogContext): LogContext {
  const sanitized = { ...context };

  // Remove sensitive fields
  sanitized.password = undefined;
  sanitized.token = undefined;
  sanitized.secret = undefined;
  sanitized.key = undefined;
  sanitized.apiKey = undefined;

  // Sanitize email addresses
  if (sanitized.email) {
    sanitized.email = sanitized.email.replace(/(.{2}).*(@.*)/, "$1***$2");
  }

  // Sanitize phone numbers
  if (sanitized.phone) {
    sanitized.phone = sanitized.phone.replace(
      /(\d{3})\d{4}(\d{4})/,
      "$1****$2",
    );
  }

  return sanitized;
}
