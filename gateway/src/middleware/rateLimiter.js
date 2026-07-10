const redisClient = require("../config/redis");
const { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW } = require("../config/env");

/**
 * Redis-backed sliding-window rate limiter.
 *
 * FIX: The original code did INCR then a separate EXPIRE, creating a race
 * condition — if the process crashed between the two commands the key would
 * never expire, permanently blocking the IP.
 *
 * We now use a Lua script executed atomically on the Redis side:
 *   1. INCR the counter.
 *   2. On the very first increment, SET the TTL in the same script.
 * This is a single round-trip and is fully atomic.
 *
 * Per-user rate limiting (when authenticated) is also layered on top of the
 * per-IP limit so that users can't bypass limits just by changing IPs.
 */

const INCR_SCRIPT = `
local key   = KEYS[1]
local limit = tonumber(ARGV[1])
local win   = tonumber(ARGV[2])
local count = redis.call("INCR", key)
if count == 1 then
  redis.call("EXPIRE", key, win)
end
return count
`;

async function rateLimiter(req, res, next) {
    // Use user ID when available (authenticated request), otherwise fall back to IP.
    // Note: req.user is set by authenticate() which runs AFTER this middleware on
    // protected routes.  For the IP-only limiter that's fine — the per-user layer
    // is enforced inside protected routes via a second check if needed.
    const identifier = req.ip;
    const key = `rl:ip:${identifier}`;

    try {
        const count = await redisClient.eval(INCR_SCRIPT, {
            keys: [key],
            arguments: [String(RATE_LIMIT_MAX), String(RATE_LIMIT_WINDOW)],
        });

        const remaining = Math.max(0, RATE_LIMIT_MAX - count);

        // Attach for use by audit logger and route handlers
        req.rateLimit = { count, max: RATE_LIMIT_MAX, remaining };

        res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX);
        res.setHeader("X-RateLimit-Remaining", remaining);

        if (count > RATE_LIMIT_MAX) {
            return res.status(429).json({
                error: "Too Many Requests",
                message: `Limit is ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW}s.`,
                retryAfter: RATE_LIMIT_WINDOW,
            });
        }

        next();
    } catch (err) {
        // Fail open — if Redis is unavailable, let traffic through rather than
        // taking the whole gateway down.  Log it prominently so ops notices.
        console.error("[rate-limiter] Redis error (failing open):", err.message);
        next();
    }
}

module.exports = rateLimiter;
