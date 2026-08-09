let store = new Map();
let expiry = new Map();

function isExpired(key) {
  const exp = expiry.get(key);
  return exp !== undefined && Date.now() > exp;
}

function cleanIfExpired(key) {
  if (isExpired(key)) {
    store.delete(key);
    expiry.delete(key);
  }
}

const redisClient = {
  async connect() {},
  async quit() {},
  async ping() { return "PONG"; },

  async get(key) {
    cleanIfExpired(key);
    return store.has(key) ? store.get(key) : null;
  },

  async set(key, value, opts = {}) {
    store.set(key, String(value));
    if (opts.EX) expiry.set(key, Date.now() + opts.EX * 1000);
    else expiry.delete(key);
    return "OK";
  },

  async del(key) {
    const existed = store.has(key);
    store.delete(key);
    expiry.delete(key);
    return existed ? 1 : 0;
  },

  async ttl(key) {
    cleanIfExpired(key);
    if (!store.has(key)) return -2;
    const exp = expiry.get(key);
    if (exp === undefined) return -1;
    return Math.max(0, Math.round((exp - Date.now()) / 1000));
  },

  async incr(key) {
    cleanIfExpired(key);
    const current = parseInt(store.get(key) || "0", 10) + 1;
    store.set(key, String(current));
    return current;
  },

  async eval(_script, { keys, arguments: args }) {
    const key = keys[0];
    const window = parseInt(args[1], 10);
    cleanIfExpired(key);
    const count = parseInt(store.get(key) || "0", 10) + 1;
    store.set(key, String(count));
    if (count === 1) expiry.set(key, Date.now() + window * 1000);
    return count;
  },

  on() { return this; },

  __reset() {
    store = new Map();
    expiry = new Map();
  },
};

module.exports = redisClient;