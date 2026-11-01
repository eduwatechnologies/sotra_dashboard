import "server-only";

const requestTimeoutMs = 15_000;

export async function proxySotraApi(
  path: string,
  init: RequestInit = {},
  timeoutMs = requestTimeoutMs
): Promise<Response> {
  const apiUrl = process.env.SOTRA_API_URL?.trim();
  const apiSecret = process.env.SOTRA_DASHBOARD_API_SECRET?.trim();
  if (!apiUrl || !apiSecret) {
    return Response.json(
      { error: "Dashboard API is not configured on the server" },
      { status: 503 }
    );
  }

  let endpoint: URL;
  try {
    const base = new URL(apiUrl);
    if (
      base.protocol !== "https:" &&
      !(base.protocol === "http:" && ["localhost", "127.0.0.1"].includes(base.hostname))
    ) {
      return Response.json(
        { error: "Dashboard API URL must use HTTPS" },
        { status: 500 }
      );
    }
    endpoint = new URL(path.replace(/^\/+/, ""), `${base.toString().replace(/\/+$/, "")}/`);
  } catch {
    return Response.json(
      { error: "Dashboard API URL is invalid" },
      { status: 500 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      ...init,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        ...init.headers,
        Authorization: `Bearer ${apiSecret}`,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      return Response.json(
        { error: "Sotra service request timed out" },
        { status: 504 }
      );
    }
    console.error("Dashboard could not reach the Sotra API.");
    return Response.json({ error: "Sotra service is unavailable" }, { status: 502 });
  }

  if (upstream.status === 404) {
    console.error(`Sotra API endpoint was not found: ${path}.`);
    return Response.json(
      { error: "Sotra API endpoint is missing. Redeploy the bot project with the latest code." },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    const status = upstream.status === 409 ? 409 : 502;
    const message =
      upstream.status === 409
        ? "A market scan is already running"
        : upstream.status === 401
          ? "Dashboard API authorization failed"
          : "Sotra service request failed";
    return Response.json({ error: message }, { status });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!/\bapplication\/(?:[\w.-]+\+)?json\b/i.test(contentType)) {
    console.error(
      `Sotra API returned a non-JSON response (HTTP ${upstream.status}, content type: ${
        contentType || "missing"
      }).`
    );
    return Response.json(
      { error: "Sotra service returned an invalid response" },
      { status: 502 }
    );
  }

  let data: unknown;
  try {
    data = await upstream.json();
  } catch {
    console.error(
      `Sotra API returned invalid JSON (HTTP ${upstream.status}, content type: ${contentType}).`
    );
    return Response.json(
      { error: "Sotra service returned an invalid response" },
      { status: 502 }
    );
  }

  return Response.json(data, { status: upstream.status });
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
