const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");

/**
 * Verifies the Bearer JWT in the Authorization header.
 * On success, attaches the decoded payload to req.user.
 * On failure, returns a 401 with a clear message.
 */
function authenticate(req, res, next) {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Unauthorized",
            message: "Missing or malformed Authorization header. Use: Bearer <token>",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Attach decoded payload: { id, email, role, iat, exp }
        req.user = decoded;
        next();
    } catch (err) {
        const message =
            err.name === "TokenExpiredError" ? "Token has expired" : "Invalid token";
        return res.status(401).json({ error: "Unauthorized", message });
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
