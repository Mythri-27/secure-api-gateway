
// const express = require("express");
// const { createProxyMiddleware } = require("http-proxy-middleware");

// const { SERVICES } = require("../config/services.js");
// const { authenticate } = require("../middleware/auth");

// const router = express.Router();

// Object.entries(SERVICES).forEach(([route, config]) => {

//     router.use(`/${route}`,authenticate, createProxyMiddleware({
//         target: config.target,
//         changeOrigin: true,
//         // logLevel: "debug",
//         onProxyReq(proxyReq, req) {
//             if (req.user) {
//                 proxyReq.setHeader(
//                     "x-user-id",
//                     req.user.id
//                 );
//                 proxyReq.setHeader(
//                     "x-user-role",
//                     req.user.role
//                 );
//             }
//         }
//     }));

// });

// module.exports=router;
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const { SERVICES } = require("../config/services");

const router = express.Router();

Object.entries(SERVICES).forEach(([route, config]) => {

    router.use(`/${route}`, (req, res, next) => {
        console.log(`Proxying ${req.originalUrl} -> ${config.target}`);
        next();
    });

    router.use(
        `/${route}`,
        createProxyMiddleware({
            target: config.target,
            changeOrigin: true,

            on: {
                proxyReq: (proxyReq, req) => {
                    console.log("Proxy request created");

                    if (req.user) {
                        proxyReq.setHeader("x-user-id", req.user.id);
                        proxyReq.setHeader("x-user-role", req.user.role);
                    }
                },

                proxyRes: (proxyRes) => {
                    console.log("Response received from service:", proxyRes.statusCode);
                },

                error: (err) => {
                    console.error("Proxy error:", err);
                }
            }
        })
    );

});

module.exports = router;