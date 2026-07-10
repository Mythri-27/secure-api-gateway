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

import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export async function createUser({
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

export async function findUserByEmail(email) {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

    return user;
}

export async function findUserById(id) {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));

    return user;
}

export async function updatePassword(id, passwordHash) {
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

export async function deleteUser(id) {
    await db
        .delete(users)
        .where(eq(users.id, id));
}