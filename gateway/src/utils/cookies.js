const { NODE_ENV, ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } = require("../config/env");

const isProd = NODE_ENV === "production";

const baseCookieOptions = {
    httpOnly: true,
    secure: isProd,   // HTTPS only in production
    sameSite: "lax",  // sent on same-site requests, incl. different localhost ports
    path: "/",
};

function setAuthCookies(res, { accessToken, refreshToken, csrfToken }) {
    res.cookie("access_token", accessToken, {
        ...baseCookieOptions,
        maxAge: ACCESS_TOKEN_TTL * 1000,
    });

    res.cookie("refresh_token", refreshToken, {
        ...baseCookieOptions,
        maxAge: REFRESH_TOKEN_TTL * 1000,
    });

    // Deliberately NOT httpOnly — the frontend reads this and echoes it
    // back in a header for double-submit CSRF protection.
    res.cookie("csrf_token", csrfToken, {
        httpOnly: false,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: REFRESH_TOKEN_TTL * 1000,
    });
}

function clearAuthCookies(res) {
    res.clearCookie("access_token", { ...baseCookieOptions });
    res.clearCookie("refresh_token", { ...baseCookieOptions });
    res.clearCookie("csrf_token", { httpOnly: false, secure: isProd, sameSite: "lax", path: "/" });
}

module.exports = { setAuthCookies, clearAuthCookies };