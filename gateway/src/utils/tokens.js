const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    ACCESS_TOKEN_TTL,
    REFRESH_TOKEN_TTL,
} = require("../config/env");

function signAccessToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_TTL }
    );
}

function verifyAccessToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

function signRefreshToken(user, jti) {
    return jwt.sign({ id: user.id, jti }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
}

function verifyRefreshToken(token) {
    return jwt.verify(token, JWT_REFRESH_SECRET);
}

function generateJti() {
    return crypto.randomBytes(16).toString("hex");
}

function generateCsrfToken() {
    return crypto.randomBytes(24).toString("hex");
}

module.exports = {
    signAccessToken,
    verifyAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    generateJti,
    generateCsrfToken,
};