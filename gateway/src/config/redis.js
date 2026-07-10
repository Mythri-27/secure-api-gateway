const { createClient } = require("redis");
const { REDIS_URL } = require("./env");

const redisClient = createClient({ url: REDIS_URL });

redisClient.on("connect", () => console.log("✅ Redis connected"));
redisClient.on("error", (err) => console.error("❌ Redis error:", err.message));
redisClient.on("reconnecting", () => console.warn("⚠️  Redis reconnecting..."));

module.exports = redisClient;
