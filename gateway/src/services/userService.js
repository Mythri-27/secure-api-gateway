const { db } = require("../db/index.js");
const { users } = require("../db/schema.js");
const { eq } = require("drizzle-orm");

async function createUser({
    email,
    passwordHash,
    role = "user",
}) {
    const [user] = await db
        .insert(users)
        .values({
            email,
            passwordHash,
            role,
        })
        .returning();

    return user;
}

async function findUserByEmail(email) {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

    return user;
}

async function findUserById(id) {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));

    return user;
}

async function updatePassword(id, passwordHash) {
    const [user] = await db
        .update(users)
        .set({
            passwordHash,
            updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

    return user;
}

async function deleteUser(id) {
    await db
        .delete(users)
        .where(eq(users.id, id));
}

module.exports = { createUser, findUserByEmail, findUserById, updatePassword, deleteUser };