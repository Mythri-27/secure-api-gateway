const postgres = require("postgres");
const { drizzle } = require("drizzle-orm/postgres-js");
const { DATABASE_URL } = require("../config/env");

const client = postgres(DATABASE_URL);
const db = drizzle(client);

module.exports = { db };