import { isSameOriginRequest, proxySotraApi } from "@/lib/sotra-api";

export async function GET(): Promise<Response> {
  return proxySotraApi("api/dashboard/strategies");
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  return proxySotraApi("api/dashboard/strategies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
