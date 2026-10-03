const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { SERVICES } = require("../config/services");
const { authenticate, authorize } = require("../middleware/auth");
const { INTERNAL_SERVICE_SECRET } = require("../config/env");
const http = require("http");
const csrfProtection = require("../middleware/csrf");

// Shared pool of reusable connections to downstream services (internal hop only).
const upstreamAgent = new http.Agent({
    keepAlive: true,
    maxSockets: 100,
    maxFreeSockets: 10,
    keepAliveMsecs: 1000,
    timeout: 5000,
});

const router = express.Router();

Object.entries(SERVICES).forEach(([route, config]) => {
    const guards = [];
    if (config.authRequired) guards.push(authenticate);
    if (config.roles?.length) guards.push(authorize(...config.roles));
    guards.push(csrfProtection);
    router.use(`/${route}`, ...guards, createProxyMiddleware({
        target: config.target,
        changeOrigin: true,
        agent: upstreamAgent,
        proxyTimeout: 5000, // give up after 5s instead of hanging forever
        timeout: 5000,
        pathRewrite: (path) => `/${route}${path}`,
        on: {//eventhandlers
            proxyReq: (proxyReq, req) => {
                if (req.user) {
                    proxyReq.setHeader("x-user-id", req.user.id);
                    proxyReq.setHeader("x-user-role", req.user.role);
                }
                proxyReq.setHeader("x-internal-secret", INTERNAL_SERVICE_SECRET);
            },
            error: (err, req, res) => {
                console.error(`[proxy] ${route} → ${config.target}:`, err.message);

                // Without this, Express never sends a response and the
                // client hangs indefinitely (this was the bug).
                if (!res.headersSent) {
                    res.writeHead(502, { "Content-Type": "application/json" });
                }
                res.end(JSON.stringify({
                    error: "Bad Gateway",
                    message: `The ${route} service is unavailable. Try again shortly.`,
                }));
            },
        },
    })
    );
});

module.exports = router;