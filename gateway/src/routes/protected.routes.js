const express = require("express");
const redisClient = require("../config/redis");
const { authorize, authenticate } = require("../middleware/auth");

const router = express.Router();

// ── GET /api/protected/profile ────────────────────────────────────
// Returns the authenticated user's profile from their JWT.
router.get("/profile", (req, res) => {
    res.json({
        message: "Authenticated",
        user: req.user,
        requestId: req.requestId,
        rateLimit: req.rateLimit,
    });
});

// ── GET /api/protected/rate-status ───────────────────────────────
// Shows current rate-limit usage for the calling IP.
router.get("/rate-status", async (req, res, next) => {
    try {
        const key = `rl:ip:${req.ip}`;
        const [count, ttl] = await Promise.all([
            redisClient.get(key),
            redisClient.ttl(key),
        ]);

        res.json({
            ip: req.ip,
            requestsThisWindow: parseInt(count) || 0,
            windowResetsInSeconds: ttl < 0 ? 0 : ttl,
            rateLimit: req.rateLimit,
        });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/protected/admin ─────────────────────────────────────
// Admin-only endpoint — demonstrates role-based access control.
router.get("/admin", authorize("admin"), (req, res) => {
    res.json({
        message: "Admin access granted",
        user: req.user,
    });
});

module.exports = router;
