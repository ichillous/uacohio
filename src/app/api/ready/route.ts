import { readRuntimeEnvironment, runtimeReadiness } from "@/lib/env/server";

export const dynamic = "force-dynamic";

export function GET() {
  const environment = readRuntimeEnvironment();
  const readiness = runtimeReadiness(environment);

  return Response.json(
    {
      checks: {
        databaseConfigured: readiness.databaseConfigured,
      },
      environment: environment.APP_ENV,
      service: "uacohio-web",
      status: readiness.ready ? "ready" : "not-ready",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
      status: readiness.ready ? 200 : 503,
    },
  );
}
