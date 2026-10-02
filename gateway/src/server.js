const app = require("./app");
const { PORT, NODE_ENV } = require("./config/env");
const redisClient = require("./config/redis");
const { registerShutdownHandlers } = require("./utils/shutdown");

async function startServer() {
    // Connect to Redis before accepting requests
    try {
        await redisClient.connect();
    } catch (err) {
        console.error(" Failed to connect to Redis:", err.message);
        console.error("   Ensure Redis is running at the configured REDIS_URL.");
        process.exit(1);
    }

    const server = app.listen(PORT, () => {
        console.log(`\n Gateway running on http://localhost:${PORT}  [${NODE_ENV}]`);
        console.log(`\n   Public routes:`);
        console.log(`     GET  /api/test/health`);
        console.log(`     GET  /api/test/health/ready`);
        console.log(`     GET  /api/test/redis`);
        console.log(`     GET  /api/test/counter`);
        console.log(`     POST /api/auth/login`);
        console.log(`     GET  /api/auth/verify`);
        console.log(`     GET  /api/protected/profile`);
        console.log(`     GET  /api/protected/rate-status`);
        console.log(`     GET  /api/protected/admin  (admin role only)\n`);
    });

    // Graceful shutdown on SIGTERM / SIGINT
    registerShutdownHandlers(server);
}

// Catch any unhandled startup errors
startServer().catch((err) => {
    console.error("Unhandled startup error:", err);
    process.exit(1);
});
