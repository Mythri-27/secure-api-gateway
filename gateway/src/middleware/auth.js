const jwt = require("jsonwebtoken");

const { JWT_SECRET } = require("../config/env");
const { findUserById } = require("../services/userService");


/**
 * Verifies the Bearer JWT in the Authorization header.
 * On success, attaches the decoded payload to req.user.
 * On failure, returns a 401 with a clear message.
 */
async function authenticate(req, res, next) {
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
        // Attach decoded payload: { id, iat, exp }
        //verify by both token and existence of user
        const user = await findUserById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: "User no longer exists",
            });
        }

        req.user = user;
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

