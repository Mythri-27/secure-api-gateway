require("dotenv").config();

const REQUIRED = ["JWT_SECRET", "JWT_REFRESH_SECRET", "DATABASE_URL"];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
}

if (
    process.env.NODE_ENV === "production" &&
    (process.env.JWT_SECRET.length < 32 || process.env.JWT_REFRESH_SECRET.length < 32)
) {
    console.error("JWT_SECRET and JWT_REFRESH_SECRET must each be at least 32 characters in production.");
    process.exit(1);
}

if (
    process.env.NODE_ENV === "production" &&
    process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET
) {
    console.error("JWT_SECRET and JWT_REFRESH_SECRET must be different values.");
    process.exit(1);
}

module.exports = {
    PORT: parseInt(process.env.PORT) || 5000,
    NODE_ENV: process.env.NODE_ENV || "development",
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    ACCESS_TOKEN_TTL: parseInt(process.env.ACCESS_TOKEN_TTL) || 900,       // 15 min
    REFRESH_TOKEN_TTL: parseInt(process.env.REFRESH_TOKEN_TTL) || 604800, // 7 days
    REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 60,
    CORS_ORIGINS: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
        : ["http://localhost:3000"],
    DATABASE_URL: process.env.DATABASE_URL,
    INTERNAL_SERVICE_SECRET: process.env.INTERNAL_SERVICE_SECRET || "dev-only-change-me",
};