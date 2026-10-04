const SERVICES = {
    products: {
        target: process.env.PRODUCT_SERVICE_URL || "http://127.0.0.1:5002",
        authRequired: true,
        roles: ["user", "admin"],
    },

    users: {
        target: "http://localhost:5001",
        authRequired: true,
        roles: ["admin"],
    },

    payments: {
        target: "http://localhost:5003",
        authRequired: true,
        roles: ["user"],
    }
};

module.exports = { SERVICES };