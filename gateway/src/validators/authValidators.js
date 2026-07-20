const { z } = require("zod");

const registerSchema = z.object({
    body: z.object({
        email: z
            .string({ required_error: "Email is required" })
            .trim()
            .toLowerCase()
            .email("Must be a valid email address"),
        password: z
            .string({ required_error: "Password is required" })
            .min(8, "Password must be at least 8 characters")
            .max(72, "Password must be at most 72 characters")
            .regex(/[a-z]/, "Password must contain a lowercase letter")
            .regex(/[A-Z]/, "Password must contain an uppercase letter")
            .regex(/[0-9]/, "Password must contain a number"),
    }),
});

const loginSchema = z.object({
    body: z.object({
        email: z
            .string({ required_error: "Email is required" })
            .trim()
            .toLowerCase()
            .email("Must be a valid email address"),
        password: z.string({ required_error: "Password is required" }).min(1, "Password is required"),
    }),
});

const roleUpdateSchema = z.object({
    body: z.object({
        role: z.enum(["user", "admin"], {
            errorMap: () => ({ message: "role must be one of: user, admin" }),
        }),
    }),
    params: z.object({
        id: z.string().regex(/^\d+$/, "id must be numeric"),
    }),
});

module.exports = { registerSchema, loginSchema, roleUpdateSchema };