import { getSession } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  return Response.json(
    { session },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
      status: session ? 200 : 401,
    },
  );
}
