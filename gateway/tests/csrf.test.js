const csrfProtection = require("../src/middleware/csrf");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("csrfProtection middleware", () => {
  test("allows GET requests through without checking any token", () => {
    const req = { method: "GET", cookies: {}, headers: {} };
    const res = mockRes();
    const next = jest.fn();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("allows HEAD and OPTIONS through too", () => {
    const next = jest.fn();

    csrfProtection({ method: "HEAD", cookies: {}, headers: {} }, mockRes(), next);
    csrfProtection({ method: "OPTIONS", cookies: {}, headers: {} }, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  test("blocks a POST with no csrf cookie or header at all", () => {
    const req = { method: "POST", cookies: {}, headers: {} };
    const res = mockRes();
    const next = jest.fn();

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("blocks a POST when the cookie is present but the header is missing", () => {
    const req = { method: "POST", cookies: { csrf_token: "abc123" }, headers: {} };
    const res = mockRes();
    const next = jest.fn();

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("blocks a POST when cookie and header are both present but don't match", () => {
    const req = {
      method: "POST",
      cookies: { csrf_token: "abc123" },
      headers: { "x-csrf-token": "different-value" },
    };
    const res = mockRes();
    const next = jest.fn();

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("allows a POST when cookie and header match", () => {
    const req = {
      method: "POST",
      cookies: { csrf_token: "abc123" },
      headers: { "x-csrf-token": "abc123" },
    };
    const res = mockRes();
    const next = jest.fn();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});