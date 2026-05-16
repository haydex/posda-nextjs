import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const target = process.env.PAPI_TARGET;

  if (!target) {
    return NextResponse.json({ error: { message: "PAPI_TARGET not configured" } }, { status: 500 });
  }

  const base = target.endsWith("/") ? target.slice(0, -1) : target;
  const upstreamUrl = new URL(`${base}/papi/v1/download/${path.join("/")}`);
  upstreamUrl.search = new URL(request.url).searchParams.toString();

  const headers = new Headers();
  const bearerToken = process.env.PAPI_BEARER_TOKEN;
  if (bearerToken) headers.set("authorization", `Bearer ${bearerToken}`);

  try {
    const res = await fetch(upstreamUrl, { method: "GET", headers, cache: "no-store" });

    const contentType = res.headers.get("content-type") ?? "application/octet-stream";

    if (!res.ok) {
      if (contentType.includes("application/json")) {
        const body = (await res.json()) as unknown;
        return NextResponse.json(body, { status: res.status });
      }
      return NextResponse.json(
        { error: { message: `Download failed with status ${res.status}` } },
        { status: res.status },
      );
    }

    const responseHeaders: Record<string, string> = { "content-type": contentType };
    const disposition = res.headers.get("content-disposition");
    if (disposition) responseHeaders["content-disposition"] = disposition;

    return new Response(res.body, { status: res.status, headers: responseHeaders });
  } catch {
    return NextResponse.json({ error: { message: "Download proxy error" } }, { status: 502 });
  }
}

export const GET = handle;
