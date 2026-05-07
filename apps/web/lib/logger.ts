/**
 * Thin logging seam for the apps/web runtime.
 *
 * Today this just forwards to `console`, but every server-side caller routes
 * through here so swapping in Sentry / OTLP later means editing one module.
 * Don't import `console` directly in lib/* — call `logger.error(...)` instead.
 */

type LoggerContext = Record<string, unknown>

function format(message: string, context?: LoggerContext): unknown[] {
  return context ? [message, context] : [message]
}

export const logger = {
  error(message: string, context?: LoggerContext): void {
    // Server console; in production this is captured by the host's stdout.
    console.error(...format(message, context))
  },
  warn(message: string, context?: LoggerContext): void {
    console.warn(...format(message, context))
  },
  info(message: string, context?: LoggerContext): void {
    if (process.env.NODE_ENV !== 'production') {
      console.info(...format(message, context))
    }
  },
}
