const { v4: uuidv4 } = require("uuid");
const { auditLog } = require("../utils/logger");

/**
 * Assigns a unique request ID, attaches it to the response header,
 * then writes a structured audit entry when the response finishes.
 *
 * NOTE: This middleware runs before `authenticate`, so `req.user` is
 * not yet set when the middleware registers.  By capturing it inside
 * the `finish` handler we get the correct userId for all routes —
 * including protected ones where `authenticate` populates req.user
 * before the response is sent.
 */
function auditLogger(req, res, next) {
    const requestId = uuidv4();
    const startTime = Date.now();

    req.requestId = requestId;
    res.setHeader("X-Request-ID", requestId);

    res.on("finish", () => {
        auditLog({
            requestId,
            ip: req.ip,
            method: req.method,
            // Use originalUrl so the full path is logged, not just the
            // router-relative segment (e.g. /api/auth/login vs /login).
            path: req.originalUrl,
            userId: req.user?.id || null,
            status: res.statusCode,
            durationMs: Date.now() - startTime,
            blocked: res.statusCode === 429,
            reason: res.statusCode === 429 ? "rate_limit_exceeded" : null,
        });
    });

    next();
}

module.exports = auditLogger;
