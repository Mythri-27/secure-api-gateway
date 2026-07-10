/**
 * 404 catch-all handler.
 * Must be registered AFTER all routes.
 */
function notFound(req, res) {
    res.status(404).json({
        error: "Not Found",
        message: `Cannot ${req.method} ${req.originalUrl}`,
    });
}

module.exports = notFound;
