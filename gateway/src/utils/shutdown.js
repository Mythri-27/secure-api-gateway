/**
 * Graceful shutdown handler.
 *
 * Registers SIGTERM and SIGINT listeners.  When a signal is received:
 *  1. Stop accepting new connections (server.close).
 *  2. Disconnect from Redis.
 *  3. Exit with code 0.
 *
 * Any step that fails causes a forced exit with code 1 after 10 s.
 */

const redisClient = require("../config/redis");

function registerShutdownHandlers(server) {
    const shutdown = async (signal) => {
        console.log(`\n🛑 ${signal} received — shutting down gracefully...`);

        // Force-kill if cleanup takes longer than 10 s
        const forceExit = setTimeout(() => {
            console.error("❌ Graceful shutdown timed out, forcing exit.");
            process.exit(1);
        }, 10_000);
        forceExit.unref();

        try {
            // 1. Stop the HTTP server
            await new Promise((resolve, reject) =>
                server.close((err) => (err ? reject(err) : resolve()))
            );
            console.log("✅ HTTP server closed");

            // 2. Disconnect Redis
            await redisClient.quit();
            console.log("✅ Redis disconnected");

            clearTimeout(forceExit);
            process.exit(0);
        } catch (err) {
            console.error("❌ Error during shutdown:", err.message);
            process.exit(1);
        }
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
}

module.exports = { registerShutdownHandlers };
