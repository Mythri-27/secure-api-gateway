const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { JWT_SECRET } = require("../config/env");
const { findByEmail, publicProfile } = require("../services/userService");

const router = express.Router();

// ── POST /api/auth/login ──────────────────────────────────────────
router.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || typeof email !== "string" || !password || typeof password !== "string") {
            return res.status(400).json({ error: "email and password are required" });
        }

        // Trim to avoid accidental whitespace issues
        const normalizedEmail = email.trim().toLowerCase();

        const user = findByEmail(normalizedEmail);

        // Use bcrypt.compare even for unknown users to avoid timing attacks.
        // We compare against a dummy hash so the response time is consistent
        // whether the user exists or not.
        const DUMMY_HASH = "$2a$12$iBaku28u8kEZ6nBaPGyViObQ9q7b9f4Y3cjCJlJ/luh9iW1IZcsMW";
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

        if (!user || !valid) {
            // Single generic message — don't leak whether the email exists
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            token,
            expiresIn: 3600,
            user: publicProfile(user),
        });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/auth/verify ──────────────────────────────────────────
// Validates a token without touching the database.
router.get("/verify", (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ valid: false, error: "Missing token" });
    }
    try {
        const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
        // Don't return the raw decoded payload — only expose safe fields
        res.json({
            valid: true,
            user: { id: decoded.id, email: decoded.email, role: decoded.role },
        });
    } catch (err) {
        res.status(401).json({
            valid: false,
            error: err.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
        });
    }
});

module.exports = router;
