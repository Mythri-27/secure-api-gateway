const express = require("express");
const bcrypt = require("bcryptjs");

const router = express.Router();

const validate = require("../middleware/validate");
const csrfProtection = require("../middleware/csrf");
const { authenticate, authorize } = require("../middleware/auth");
const { registerSchema, loginSchema, roleUpdateSchema } = require("../validators/authValidators");
const { setAuthCookies, clearAuthCookies } = require("../utils/cookies");
const {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    generateJti,
    generateCsrfToken,
} = require("../utils/tokens");
const refreshTokenStore = require("../utils/refreshTokenStore");
const { createUser, findUserByEmail, findUserById, updateRole } = require("../services/userService");

function publicProfile(user) {
    return { id: user.id, email: user.email, role: user.role };
}

/** Issues a fresh access+refresh token pair, records the refresh jti, sets cookies. */
async function issueSession(res, user) {
    const jti = generateJti();
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user, jti);
    const csrfToken = generateCsrfToken();

    await refreshTokenStore.setCurrent(user.id, jti);
    setAuthCookies(res, { accessToken, refreshToken, csrfToken });
}

// ── POST /api/auth/register ───────────────────────────────────────
router.post("/register", validate(registerSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body; // role stripped by the schema, never trusted from client

        const existing = await findUserByEmail(email);
        if (existing) {
            return res.status(409).json({ message: "Email already exists" });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await createUser({ email, passwordHash, role: "user" });

        await issueSession(res, user);
        res.status(201).json({ user: publicProfile(user) });
    } catch (err) {
        next(err);
    }
});

// ── PATCH /api/auth/users/:id/role ────────────────────────────────
router.patch(
    "/users/:id/role",
    authenticate,
    authorize("admin"),
    csrfProtection,
    validate(roleUpdateSchema),
    async (req, res, next) => {
        try {
            const { role } = req.body;
            const updated = await updateRole(req.params.id, role);

            if (!updated) {
                return res.status(404).json({ error: "User not found" });
            }

            res.json({ user: publicProfile(updated) });
        } catch (err) {
            next(err);
        }
    }
);

// ── POST /api/auth/login ──────────────────────────────────────────
router.post("/login", validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await findUserByEmail(email);

        const DUMMY_HASH = "$2a$12$iBaku28u8kEZ6nBaPGyViObQ9q7b9f4Y3cjCJlJ/luh9iW1IZcsMW";
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

        if (!user || !valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        await issueSession(res, user);
        res.json({ user: publicProfile(user) });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/auth/refresh ────────────────────────────────────────
// Rotates the refresh token on every use. If the presented jti doesn't
// match what's on record, treat it as a stolen/replayed token and kill
// every session for that user as a precaution.
router.post("/refresh", csrfProtection, async (req, res, next) => {
    try {
        const token = req.cookies?.refresh_token;
        if (!token) {
            return res.status(401).json({ error: "Unauthorized", message: "No refresh token" });
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(token);
        } catch {
            clearAuthCookies(res);
            return res.status(401).json({ error: "Unauthorized", message: "Invalid or expired refresh token" });
        }

        const status = await refreshTokenStore.checkJti(decoded.id, decoded.jti);

        if (status === "invalid") {
            console.warn(`[auth] Refresh token reuse detected for user ${decoded.id} — revoking session.`);
            await refreshTokenStore.revokeAll(decoded.id);
            clearAuthCookies(res);
            return res.status(401).json({ error: "Unauthorized", message: "Refresh token has been revoked" });
        }

        const user = await findUserById(decoded.id);
        if (!user) {
            await refreshTokenStore.revokeAll(decoded.id);
            clearAuthCookies(res);
            return res.status(401).json({ error: "Unauthorized", message: "User no longer exists" });
        }

        if (status === "current") {
            // Normal case — rotate to a new refresh token.
            await issueSession(res, user);
        } else {
            // status === "previous": a legitimate concurrent duplicate call
            // within the grace window (e.g. two protected requests expiring
            // at once). Don't rotate again — just reissue a fresh access
            // token bound to the CURRENT jti so this request succeeds too,
            // instead of being flagged as reuse.
            const currentJti = await refreshTokenStore.getCurrentJti(user.id);
            const accessToken = signAccessToken(user);
            const refreshToken = signRefreshToken(user, currentJti);
            const csrfToken = req.cookies.csrf_token || generateCsrfToken();
            setAuthCookies(res, { accessToken, refreshToken, csrfToken });
        }

        res.json({ user: publicProfile(user) });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/auth/logout ─────────────────────────────────────────
// Best-effort revoke; always clears cookies regardless of token state
// so the client is never stuck appearing "logged in".
router.post("/logout", async (req, res) => {
    try {
        const token = req.cookies?.refresh_token;
        if (token) {
            const decoded = verifyRefreshToken(token);
            await refreshTokenStore.revoke(decoded.id);
        }
    } catch {
        // Invalid/expired — nothing to revoke server-side.
    } finally {
        clearAuthCookies(res);
    }

    res.json({ message: "Logged out" });
});

// ── GET /api/auth/me ──────────────────────────────────────────────
// Frontend calls this on load to restore session state, since tokens
// live in httpOnly cookies the client can't read directly.
router.get("/me", authenticate, (req, res) => {
    res.json({ user: publicProfile(req.user) });
});

// ── GET /api/auth/verify ──────────────────────────────────────────
router.get("/verify", authenticate, (req, res) => {
    res.json({ valid: true, user: publicProfile(req.user) });
});

module.exports = router;