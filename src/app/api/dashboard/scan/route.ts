import { isSameOriginRequest, proxySotraApi } from "@/lib/sotra-api";

export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  return proxySotraApi(
    "api/dashboard/scan",
    { method: "POST" },
    55_000
  );
}
