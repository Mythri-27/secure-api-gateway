const redisClient = require("../config/redis");
const { REFRESH_TOKEN_TTL } = require("../config/env");

// Window during which a just-rotated (previous) refresh token is still
// accepted. Covers legitimate concurrent requests (e.g. a page firing
// several protected API calls at once, all expiring together) without
// weakening protection against real token replay/theft.
const GRACE_PERIOD_SECONDS = 10;

const currentKey = (userId) => `refresh:current:${userId}`;
const previousKey = (userId) => `refresh:previous:${userId}`;

/** Rotates: demotes the existing current jti to "previous" (short grace TTL), stores the new one as current. */
async function setCurrent(userId, jti) {
    const existingCurrent = await redisClient.get(currentKey(userId));
    if (existingCurrent) {
        await redisClient.set(previousKey(userId), existingCurrent, { EX: GRACE_PERIOD_SECONDS });
    }
    await redisClient.set(currentKey(userId), jti, { EX: REFRESH_TOKEN_TTL });
}

async function getCurrentJti(userId) {
    return redisClient.get(currentKey(userId));
}

/**
 * Returns "current" if jti matches the active token, "previous" if it
 * matches a token rotated within the grace window (legit concurrent
 * call), or "invalid" if it matches neither (real reuse/replay).
 */
async function checkJti(userId, jti) {
    const current = await redisClient.get(currentKey(userId));
    if (current === jti) return "current";

    const previous = await redisClient.get(previousKey(userId));
    if (previous === jti) return "previous";

    return "invalid";
}

async function revokeAll(userId) {
    await redisClient.del(currentKey(userId));
    await redisClient.del(previousKey(userId));
}

module.exports = { setCurrent, getCurrentJti, checkJti, revokeAll };