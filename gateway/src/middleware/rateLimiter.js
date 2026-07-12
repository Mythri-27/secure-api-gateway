const redisClient = require("../config/redis");
const { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW } = require("../config/env");

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

async function incrAndCheck(key, max, window) {
    const count = await redisClient.eval(INCR_SCRIPT, {
        keys: [key],
        arguments: [String(max), String(window)],
    });
    return { count, remaining: Math.max(0, max - count), exceeded: count > max };
}

// IP-layer limiter — runs early, before auth, on every request.
async function rateLimiter(req, res, next) {
    const key = `rl:ip:${req.ip}`;

    try {
        const { count, remaining, exceeded } = await incrAndCheck(
            key,
            RATE_LIMIT_MAX,
            RATE_LIMIT_WINDOW
        );

        req.rateLimit = { count, max: RATE_LIMIT_MAX, remaining };
        res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX);
        res.setHeader("X-RateLimit-Remaining", remaining);

        if (exceeded) {
            return res.status(429).json({
                error: "Too Many Requests",
                message: `IP limit is ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW}s.`,
                retryAfter: RATE_LIMIT_WINDOW,
            });
        }

        next();
    } catch (err) {
        console.error("[rate-limiter] Redis error (failing open):", err.message);
        next();
    }
}

// User-layer limiter — runs AFTER authenticate(), so req.user is set.
// Prevents an authenticated user from bypassing IP limits by rotating IPs.
async function userRateLimiter(req, res, next) {
    if (!req.user) return next(); // no-op if not authenticated

    const key = `rl:user:${req.user.id}`;

    try {
        const { count, remaining, exceeded } = await incrAndCheck(
            key,
            RATE_LIMIT_MAX,
            RATE_LIMIT_WINDOW
        );

        // Merge with the IP-layer info already on req.rateLimit
        req.rateLimit = { ...req.rateLimit, userCount: count, userRemaining: remaining };

        if (exceeded) {
            return res.status(429).json({
                error: "Too Many Requests",
                message: `Per-user limit is ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW}s.`,
                retryAfter: RATE_LIMIT_WINDOW,
            });
        }

        next();
    } catch (err) {
        console.error("[user-rate-limiter] Redis error (failing open):", err.message);
        next();
    }
}

module.exports = rateLimiter;
module.exports.userRateLimiter = userRateLimiter;