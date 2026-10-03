jest.mock("../src/services/userService");
jest.mock("../src/config/redis");
const redisClient = require("../src/config/redis");
const jwt = require("jsonwebtoken");
const { findUserById } = require("../src/services/userService");
const { authenticate, authorize } = require("../src/middleware/auth");
const { JWT_SECRET } = require("../src/config/env");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function signToken(payload, opts = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h", ...opts });
}

describe("authenticate middleware", () => {
  beforeEach(() => redisClient.__reset());
  test("returns 401 NO_TOKEN when there's no access_token cookie", async () => {
    const req = { cookies: {} };
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "NO_TOKEN" }));
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 401 INVALID_TOKEN for garbage input", async () => {
    const req = { cookies: { access_token: "this-is-not-a-jwt" } };
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "INVALID_TOKEN" }));
  });

  test("returns 401 TOKEN_EXPIRED for an expired token", async () => {
    const token = signToken({ id: 1, email: "a@test.com", role: "user" }, { expiresIn: "-10s" });
    const req = { cookies: { access_token: token } };
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "TOKEN_EXPIRED" }));
  });

  test("returns 401 USER_NOT_FOUND when the token is valid but the user was deleted", async () => {
    findUserById.mockResolvedValue(undefined);
    const token = signToken({ id: 99, email: "gone@test.com", role: "user" });
    const req = { cookies: { access_token: token } };
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "USER_NOT_FOUND" }));
  });

  test("attaches req.user and calls next() when everything is valid", async () => {
    const dbUser = { id: 1, email: "a@test.com", role: "user" };
    findUserById.mockResolvedValue(dbUser);
    const token = signToken({ id: 1, email: "a@test.com", role: "user" });
    const req = { cookies: { access_token: token } };
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(req.user).toEqual(dbUser);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("authorize middleware", () => {
  test("calls next() when the user's role is allowed", () => {
    const req = { user: { id: 1, role: "admin" } };
    const res = mockRes();
    const next = jest.fn();

    authorize("admin")(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("returns 403 when the user's role is not allowed", () => {
    const req = { user: { id: 1, role: "user" } };
    const res = mockRes();
    const next = jest.fn();

    authorize("admin")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 403 when req.user doesn't exist at all", () => {
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    authorize("admin", "user")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("allows access when role matches one of several allowed roles", () => {
    const req = { user: { id: 2, role: "user" } };
    const res = mockRes();
    const next = jest.fn();

    authorize("admin", "user")(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});