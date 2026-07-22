import { z } from "zod";

const runtimeEnvironmentSchema = z
  .object({
    APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
    DEV_AUTH_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  })
  .superRefine((environment, context) => {
    if (
      environment.DEV_AUTH_ENABLED &&
      environment.APP_ENV !== "development" &&
      environment.APP_ENV !== "test"
    ) {
      context.addIssue({
        code: "custom",
        message: "DEV_AUTH_ENABLED must be false outside development and test environments.",
        path: ["DEV_AUTH_ENABLED"],
      });
    }
  });

export type RuntimeEnvironment = z.infer<typeof runtimeEnvironmentSchema>;

export function readRuntimeEnvironment(
  source: Record<string, string | undefined> = process.env,
): RuntimeEnvironment {
  return runtimeEnvironmentSchema.parse({
    APP_ENV: source.APP_ENV,
    DEV_AUTH_ENABLED: source.DEV_AUTH_ENABLED,
    NEXT_PUBLIC_SITE_URL: source.NEXT_PUBLIC_SITE_URL,
    NODE_ENV: source.NODE_ENV,
  });
}

export function isDevAuthAllowed(environment: RuntimeEnvironment): boolean {
  return (
    environment.DEV_AUTH_ENABLED &&
    (environment.APP_ENV === "development" || environment.APP_ENV === "test")
  );
}

export function runtimeReadiness(_environment: RuntimeEnvironment, databaseAvailable: boolean) {
  return {
    databaseAvailable,
    ready: databaseAvailable,
  };
}
