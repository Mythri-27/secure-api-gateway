jest.mock("../src/config/redis");

const redisClient = require("../src/config/redis");
const rateLimiter = require("../src/middleware/rateLimiter");//actual middleware
const { RATE_LIMIT_MAX } = require("../src/config/env");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  return res;
}

describe("rateLimiter (per-IP)", () => {
  beforeEach(() => redisClient.__reset());

  test("allows a request under the limit", async () => {
    const req = { ip: "1.1.1.1" };
    const res = mockRes();
    const next = jest.fn();

    await rateLimiter(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("blocks with 429 once the IP goes over RATE_LIMIT_MAX", async () => {
    const req = { ip: "2.2.2.2" };
    const next = jest.fn();

    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      await rateLimiter(req, mockRes(), next);
    }

    const res = mockRes();
    await rateLimiter(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
  });
});