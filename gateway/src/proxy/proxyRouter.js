const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { SERVICES } = require("../config/services");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

Object.entries(SERVICES).forEach(([route, config]) => {
    const guards = [];
    if (config.authRequired) guards.push(authenticate);
    if (config.roles?.length) guards.push(authorize(...config.roles));

    router.use(
        `/${route}`,
        ...guards,
        createProxyMiddleware({
            target: config.target,
            changeOrigin: true,
            pathRewrite: (path) => `/${route}${path}`, 
            on: {
                proxyReq: (proxyReq, req) => {
                    if (req.user) {
                        proxyReq.setHeader("x-user-id", req.user.id);
                        proxyReq.setHeader("x-user-role", req.user.role);
                    }
                },
                error: (err) => console.error("Proxy error:", err),
            },
        })
    );
});

module.exports = router;