const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../../logs");

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logStream = fs.createWriteStream(path.join(LOG_DIR, "audit.log"), {
    flags: "a", // append mode
});

/**
 * Write a structured audit log entry to file and console.
 *
 * @param {object} entry
 * @param {string}  entry.requestId
 * @param {string}  entry.ip
 * @param {string}  entry.method
 * @param {string}  entry.path
 * @param {string|null} entry.userId
 * @param {number}  entry.status
 * @param {number}  entry.durationMs
 * @param {boolean} entry.blocked
 * @param {string|null} entry.reason
 */
function auditLog({ requestId, ip, method, path: reqPath, userId, status, durationMs, blocked, reason }) {
    const entry = {
        timestamp: new Date().toISOString(),
        requestId,
        ip,
        method,
        path: reqPath,
        userId: userId || "anonymous",
        status,
        durationMs,
        blocked: blocked || false,
        reason: reason || null,
    };

    logStream.write(JSON.stringify(entry) + "\n");

    // Colour-coded console output — only in non-production or when not silenced
    if (process.env.NODE_ENV !== "production") {
        const color = status >= 400 ? "\x1b[31m" : "\x1b[32m";
        console.log(
            `${color}[AUDIT]\x1b[0m ${entry.timestamp} | ${method} ${entry.path} | ${status} | ${durationMs}ms | IP: ${ip} | User: ${entry.userId}`
        );
    }
}

module.exports = { auditLog };
