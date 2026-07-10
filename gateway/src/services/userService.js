/**
 * In-memory user store.
 *
 * TRADEOFF: This is intentionally kept as a simple in-memory store for the
 * current scope of the project.  The folder + function structure already
 * mirrors what a real DB-backed service would look like (findByEmail,
 * findById) so swapping in a Neon/Postgres client later requires only
 * changing this file.
 *
 * All passwords are bcrypt-hashed (cost factor 12).
 * Plain-text password for both seed users: "password123"
 */

const USERS = [
    {
        id: "user_001",
        email: "admin@gateway.dev",
        passwordHash: "$2a$12$iBaku28u8kEZ6nBaPGyViObQ9q7b9f4Y3cjCJlJ/luh9iW1IZcsMW",
        role: "admin",
    },
    {
        id: "user_002",
        email: "user@gateway.dev",
        passwordHash: "$2a$12$iBaku28u8kEZ6nBaPGyViObQ9q7b9f4Y3cjCJlJ/luh9iW1IZcsMW",
        role: "user",
    },
];

/**
 * Find a user by email address (case-insensitive).
 * @param {string} email
 * @returns {object|undefined}
 */
function findByEmail(email) {
    return USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

/**
 * Find a user by their ID.
 * @param {string} id
 * @returns {object|undefined}
 */
function findById(id) {
    return USERS.find((u) => u.id === id);
}

/**
 * Return a safe public view of the user (no passwordHash).
 * @param {object} user
 * @returns {object}
 */
function publicProfile(user) {
    const { passwordHash: _omit, ...profile } = user;
    return profile;
}

module.exports = { findByEmail, findById, publicProfile };
