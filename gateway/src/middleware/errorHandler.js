const { NODE_ENV } = require("../config/env");

/**
 * Global error handler.
 * Must be registered last (Express detects it by 4 arguments).
 * In production we hide the stack trace from clients.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    const status = err.status || err.statusCode || 500;
    const message = status < 500 ? err.message : "Internal Server Error";

    // Always log the full error server-side
    console.error(`[error-handler] ${req.method} ${req.originalUrl} →`, err);

    res.status(status).json({
        error: message,
        ...(NODE_ENV !== "production" && { stack: err.stack }),
    });
}

module.exports = errorHandler;
