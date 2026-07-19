import { z } from "zod";

const runtimeEnvironmentSchema = z.object({
  APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  REQUIRE_DATABASE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type RuntimeEnvironment = z.infer<typeof runtimeEnvironmentSchema>;

export function readRuntimeEnvironment(
  source: Record<string, string | undefined> = process.env,
): RuntimeEnvironment {
  return runtimeEnvironmentSchema.parse({
    APP_ENV: source.APP_ENV,
    DATABASE_URL: source.DATABASE_URL,
    NEXT_PUBLIC_SITE_URL: source.NEXT_PUBLIC_SITE_URL,
    NODE_ENV: source.NODE_ENV,
    REQUIRE_DATABASE: source.REQUIRE_DATABASE,
  });
}

export function runtimeReadiness(environment: RuntimeEnvironment) {
  const databaseConfigured = Boolean(environment.DATABASE_URL);

  return {
    databaseConfigured,
    ready: environment.REQUIRE_DATABASE ? databaseConfigured : true,
  };
}
