const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const { NODE_ENV, CORS_ORIGINS } = require("./config/env");
const rateLimiter = require("./middleware/rateLimiter");
const { userRateLimiter } = require("./middleware/rateLimiter");
const { authenticate } = require("./middleware/auth");
const auditLogger = require("./middleware/auditLogger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const testRoutes = require("./routes/test.routes");
const authRoutes = require("./routes/auth.routes");
const protectedRoutes = require("./routes/protected.routes");
const proxyRouter=require("./proxy/proxyRouter.js");

const app = express();


// ── Security headers ───────────────────────────────────────────────
app.use(helmet());
// API responses must never be cached; lock down browser features.
app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
});

// ── CORS ───────────────────────────────────────────────────────────
app.use(
    cors({
        origin: NODE_ENV === "production" ?CORS_ORIGINS : true,
        methods: ["GET", "POST", "PUT", "PATCH","DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type","Authorization", "X-CSRF-Token"],
        credentials: true,
    })
);

// ── Body parsing — limit size to prevent large-payload attacks ─────
const jsonParser = express.json({ limit: "10kb" });
const urlencodedParser = express.urlencoded({ extended: true, limit: "10kb" });
app.use(cookieParser());

// ── HTTP request logging ───────────────────────────────────────────
// Use "combined" (Apache-style) in production for log aggregators,
// "dev" (coloured, short) in development.
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));

// ── Audit logging (all requests → audit.log) ───────────────────────
app.use(auditLogger);

// ── Rate limiting (all requests) ──────────────────────────────────
app.use(rateLimiter);

// ── Routes 
app.use("/api/test", testRoutes);                              // Public
app.use("/api/auth", jsonParser, urlencodedParser,authRoutes);                             // Public
app.use("/api/protected", authenticate, userRateLimiter, jsonParser, urlencodedParser, protectedRoutes);     // JWT required

app.use("/api",proxyRouter); // dynamic proxy routing 

// ── Error handling ─────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
