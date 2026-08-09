jest.mock("../src/config/redis");

const redisClient = require("../src/config/redis");
const refreshTokenStore = require("../src/utils/refreshTokenStore");

describe("refreshTokenStore", () => {
  beforeEach(() => redisClient.__reset());

  test("checkJti returns 'invalid' for a jti that was never issued", async () => {
    const status = await refreshTokenStore.checkJti(1, "some-random-jti-that-does-not-exist");
    expect(status).toBe("invalid");
  });

  test("setCurrent stores a jti, and checkJti recognizes it as 'current'", async () => {
    await refreshTokenStore.setCurrent(1, "jti-A");

    const status = await refreshTokenStore.checkJti(1, "jti-A");

    expect(status).toBe("current");
  });

  test("getCurrentJti returns the jti that was just set", async () => {
    await refreshTokenStore.setCurrent(1, "jti-A");

    const jti = await refreshTokenStore.getCurrentJti(1);

    expect(jti).toBe("jti-A");
  });

  test("rotating (calling setCurrent again) demotes the old jti to 'previous'", async () => {
    await refreshTokenStore.setCurrent(1, "jti-A");
    await refreshTokenStore.setCurrent(1, "jti-B"); // simulates a refresh — rotation happens

    const statusOfOld = await refreshTokenStore.checkJti(1, "jti-A");
    const statusOfNew = await refreshTokenStore.checkJti(1, "jti-B");

    expect(statusOfOld).toBe("previous");
    expect(statusOfNew).toBe("current");
  });

  test("a jti from two rotations ago is 'invalid', not 'previous'", async () => {
    await refreshTokenStore.setCurrent(1, "jti-A");
    await refreshTokenStore.setCurrent(1, "jti-B"); // jti-A becomes "previous"
    await refreshTokenStore.setCurrent(1, "jti-C"); // jti-B becomes "previous", jti-A falls off entirely

    const statusOfOldest = await refreshTokenStore.checkJti(1, "jti-A");

    expect(statusOfOldest).toBe("invalid");
  });

  test("different users have completely separate jti tracking", async () => {
    await refreshTokenStore.setCurrent(1, "user1-jti");
    await refreshTokenStore.setCurrent(2, "user2-jti");

    const user1Status = await refreshTokenStore.checkJti(1, "user2-jti"); // user 1's jti checked against user 2's token
    const user2Status = await refreshTokenStore.checkJti(2, "user2-jti");

    expect(user1Status).toBe("invalid");
    expect(user2Status).toBe("current");
  });

  test("revokeAll clears both current and previous, so any jti becomes 'invalid'", async () => {
    await refreshTokenStore.setCurrent(1, "jti-A");
    await refreshTokenStore.setCurrent(1, "jti-B"); // jti-A is now "previous"

    await refreshTokenStore.revokeAll(1);

    const statusA = await refreshTokenStore.checkJti(1, "jti-A");
    const statusB = await refreshTokenStore.checkJti(1, "jti-B");

    expect(statusA).toBe("invalid");
    expect(statusB).toBe("invalid");
  });
});