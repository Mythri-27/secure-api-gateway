require("dotenv").config();
const { z } = require("zod");

const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(5000),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
    ACCESS_TOKEN_TTL: z.coerce.number().int().positive().default(900),
    REFRESH_TOKEN_TTL: z.coerce.number().int().positive().default(604800),
    REDIS_URL: z.string().default("redis://localhost:6379"),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    RATE_LIMIT_WINDOW: z.coerce.number().int().positive().default(60),
    CORS_ORIGINS: z.string().optional(),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    INTERNAL_SERVICE_SECRET: z.string().default("dev-only-change-me"),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === "production") {
      if (env.JWT_SECRET.length < 32) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["JWT_SECRET"], message: "must be at least 32 characters in production" });
      }
      if (env.JWT_REFRESH_SECRET.length < 32) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["JWT_REFRESH_SECRET"], message: "must be at least 32 characters in production" });
      }
      if (env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["JWT_REFRESH_SECRET"], message: "must be different from JWT_SECRET" });
      }
      if (env.INTERNAL_SERVICE_SECRET === "dev-only-change-me") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["INTERNAL_SERVICE_SECRET"], message: "must be set to a real secret in production" });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:\n");
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
  }
  console.error("\nCheck your .env file against .env.example and fix the above.\n");
  process.exit(1);
}

const env = parsed.data;

module.exports = {
  PORT: env.PORT,
  NODE_ENV: env.NODE_ENV,
  JWT_SECRET: env.JWT_SECRET,
  JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
  ACCESS_TOKEN_TTL: env.ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL: env.REFRESH_TOKEN_TTL,
  REDIS_URL: env.REDIS_URL,
  RATE_LIMIT_MAX: env.RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW: env.RATE_LIMIT_WINDOW,
  CORS_ORIGINS: env.CORS_ORIGINS ? env.CORS_ORIGINS.split(",").map((s) => s.trim()) : ["http://localhost:3000"],
  DATABASE_URL: env.DATABASE_URL,
  INTERNAL_SERVICE_SECRET: env.INTERNAL_SERVICE_SECRET,
};