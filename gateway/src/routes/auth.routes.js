const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

const { JWT_SECRET } = require("../config/env");

const {
    createUser,
    findUserByEmail,
} = require("../services/userService");

// Helper to avoid exposing password hash
function publicProfile(user) {
    return {
        id: user.id,
        email: user.email,
        role: user.role,
    };
}

// ── POST /api/auth/register ───────────────────────────────────────
router.post("/register", async (req, res, next) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existing = await findUserByEmail(normalizedEmail);

        if (existing) {
            return res.status(409).json({
                message: "Email already exists",
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await createUser({
            email: normalizedEmail,
            passwordHash,
            role: role || "user",
        });

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            JWT_SECRET,
            {
                expiresIn: "1h",
            }
        );

        res.status(201).json({
            token,
            user: publicProfile(user),
        });

    } catch (err) {
        next(err);
    }
});

// ── POST /api/auth/login ──────────────────────────────────────────
router.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await findUserByEmail(normalizedEmail);

        const DUMMY_HASH =
            "$2a$12$iBaku28u8kEZ6nBaPGyViObQ9q7b9f4Y3cjCJlJ/luh9iW1IZcsMW";

        const valid = await bcrypt.compare(
            password,
            user?.passwordHash ?? DUMMY_HASH
        );

        if (!user || !valid) {
            return res.status(401).json({
                error: "Invalid credentials",
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            JWT_SECRET,
            {
                expiresIn: "1h",
            }
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
router.get("/verify", (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            valid: false,
            error: "Missing token",
        });
    }

    try {
        const decoded = jwt.verify(
            authHeader.split(" ")[1],
            JWT_SECRET
        );

        res.json({
            valid: true,
            user: {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
            },
        });

    } catch (err) {
        res.status(401).json({
            valid: false,
            error:
                err.name === "TokenExpiredError"
                    ? "Token expired"
                    : "Invalid token",
        });
    }
});

module.exports = router;