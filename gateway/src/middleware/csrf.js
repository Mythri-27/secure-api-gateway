const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function csrfProtection(req, res, next) {
    if (SAFE_METHODS.has(req.method)) return next();

    const cookieToken = req.cookies?.csrf_token;
    const headerToken = req.headers["x-csrf-token"];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({
            error: "Forbidden",
            message: "Missing or invalid CSRF token.",
        });
    }

    next();
}

module.exports = csrfProtection;