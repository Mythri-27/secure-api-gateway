const express = require("express");
const redisClient = require("../config/redis");

const router = express.Router();

// ── GET /api/test/health ──────────────────────────────────────────
// Basic liveness check.  Does NOT check Redis — use /health/ready for that.
router.get("/health", (req, res) => {
    res.json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// ── GET /api/test/health/ready ────────────────────────────────────
// Readiness check — verifies Redis is reachable.
// Use this as the Kubernetes/Docker readiness probe target.
router.get("/health/ready", async (req, res, next) => {
    try {
        await redisClient.ping();
        res.json({ status: "ready", redis: "ok" });
    } catch (err) {
        // Service is not ready — return 503
        res.status(503).json({ status: "not_ready", redis: "unavailable" });
    }
});

// ── GET /api/test/redis ───────────────────────────────────────────
// Sanity check Redis SET/GET using a namespaced test key.
router.get("/redis", async (req, res, next) => {
    try {
        const testKey = "test:ping";
        await redisClient.set(testKey, "pong", { EX: 10 });
        const value = await redisClient.get(testKey);
        res.json({ key: testKey, value });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/test/counter ─────────────────────────────────────────
// Namespaced visit counter demo (not a global polluter anymore).
router.get("/counter", async (req, res, next) => {
    try {
        const count = await redisClient.incr("test:visits");
        res.json({ visits: count });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
