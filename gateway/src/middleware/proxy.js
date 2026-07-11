const { createProxyMiddleware } = require("http-proxy-middleware");

function createServiceProxy(target) {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: (path) => "/products" + path,
    });
}

module.exports = { createServiceProxy };