const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET;

if (!INTERNAL_SERVICE_SECRET) {
    console.error("INTERNAL_SERVICE_SECRET is not set. Refusing to start.");
    process.exit(1);
}

export function verifyGateway(req, res, next) {
    const secret = req.headers["x-internal-secret"];

    if (secret !== INTERNAL_SERVICE_SECRET) {
        return res.status(403).json({
            error: "Forbidden",
            message: "This service only accepts traffic via the API gateway.",
        });
    }

    next();
}