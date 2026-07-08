const { createClient } = require("redis");
const { REDIS_URL } = require("./env");

const redisClient = createClient({
    url: REDIS_URL,
});

redisClient.on("connect", () => {
    console.log("✅ Connected to Redis");
});

redisClient.on("error", (err) => {
    console.error("❌ Redis Error:", err.message);
});

module.exports = redisClient;