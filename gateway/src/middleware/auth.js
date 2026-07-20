const { verifyAccessToken } = require("../utils/tokens");
const { findUserById } = require("../services/userService");

/**
 * Verifies the access token stored in the httpOnly `access_token` cookie.
 * On success, attaches the DB user record to req.user.
 * Expired tokens get code: "TOKEN_EXPIRED" so the frontend knows it's
 * worth attempting a silent refresh instead of bouncing to /login.
 */
async function authenticate(req, res, next) {
    const token = req.cookies?.access_token;

    if (!token) {
        return res.status(401).json({
            error: "Unauthorized",
            code: "NO_TOKEN",
            message: "Not authenticated.",
        });
    }

    try {
        const decoded = verifyAccessToken(token);
        const user = await findUserById(decoded.id);

        if (!user) {
            return res.status(401).json({
                error: "Unauthorized",
                code: "USER_NOT_FOUND",
                message: "User no longer exists",
            });
        }

        req.user = user;
        next();
    } catch (err) {
        const expired = err.name === "TokenExpiredError";
        return res.status(401).json({
            error: "Unauthorized",
            code: expired ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
            message: expired ? "Access token has expired" : "Invalid token",
        });
    }
}

/**
 * Role-based authorisation factory.
 * Usage: router.get('/admin', authenticate, authorize('admin'), handler)
 */
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                error: "Forbidden",
                message: `This route requires one of these roles: ${roles.join(", ")}`,
            });
        }
        next();
    };
}

module.exports = { authenticate, authorize };