import { getD1Database } from "@/db/d1";
import { readRuntimeEnvironment, runtimeReadiness } from "@/lib/env/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const environment = readRuntimeEnvironment();
  let databaseAvailable = false;

  try {
    const database = await getD1Database();
    const result = await database.prepare("SELECT 1 AS healthy").first<{ healthy: number }>();
    databaseAvailable = result?.healthy === 1;
  } catch {
    databaseAvailable = false;
  }

  const readiness = runtimeReadiness(environment, databaseAvailable);

  return Response.json(
    {
      checks: {
        databaseAvailable: readiness.databaseAvailable,
      },
      environment: environment.APP_ENV,
      service: "uacohio-web",
      status: readiness.ready ? "ready" : "not-ready",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
      status: readiness.ready ? 200 : 503,
    },
  );
}
