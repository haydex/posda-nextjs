import { NextResponse } from "next/server";
import { PapiHttpError, papiRequest, type PapiRequestOptions } from "@/lib/papi";

type RouteContext = { params: Promise<{ path?: string[] }> };

const ALLOWED_ROOTS = new Set([
  "lookups",
  "datasets",
  "recordsets",
  "transfers",
]);
const FORWARDABLE_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

function buildUpstreamPath(path?: string[]) {
  if (!path || path.length === 0) {
    return null;
  }

  const [root] = path;
  if (!ALLOWED_ROOTS.has(root)) {
    return null;
  }

  return `/${path.join("/")}`;
}

function toPapiErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof PapiHttpError) {
    return NextResponse.json(
      {
        error: {
          code: error.code ?? "INTERNAL_ERROR",
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: fallbackMessage,
      },
    },
    { status: 502 },
  );
}

async function readOptionalJsonBody(request: Request): Promise<unknown | undefined> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return undefined;
  }

  const raw = await request.text();
  if (!raw.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

function parsePositiveInteger(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.floor(parsed);
}

function applyPagination<T>(payload: T, request: Request): T {
  const query = new URL(request.url).searchParams;
  const limit =
    parsePositiveInteger(query.get("limit")) ??
    parsePositiveInteger(query.get("page_size")) ??
    parsePositiveInteger(query.get("items_per_page"));

  if (!limit) {
    return payload;
  }

  const page = parsePositiveInteger(query.get("page")) ?? 1;
  const offsetFromQuery = parsePositiveInteger(query.get("offset"));
  const offset =
    offsetFromQuery !== null ? offsetFromQuery : Math.max(0, (page - 1) * limit);

  if (Array.isArray(payload)) {
    return payload.slice(offset, offset + limit) as T;
  }

  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const prioritizedKeys = [
    "data",
    "licenses",
    "datasets",
    "recordsets",
    "releases",
    "drafts",
    "transfers",
  ];

  const record = payload as Record<string, unknown>;
  const targetKey =
    prioritizedKeys.find((key) => Array.isArray(record[key])) ??
    Object.keys(record).find((key) => Array.isArray(record[key]));

  if (!targetKey) {
    return payload;
  }

  return {
    ...record,
    [targetKey]: (record[targetKey] as unknown[]).slice(offset, offset + limit),
  } as T;
}

async function forwardFromRequest(request: Request, path: string, fallbackMessage: string) {
  const method = request.method.toUpperCase();
  if (!FORWARDABLE_METHODS.has(method)) {
    return NextResponse.json(
      {
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: `Method ${method} is not allowed.`,
        },
      },
      { status: 405 },
    );
  }

  const query = new URL(request.url).searchParams;
  const options: PapiRequestOptions = {
    query,
    ...(method === "GET" ? {} : { method: method as PapiRequestOptions["method"] }),
  };

  if (method !== "GET") {
    const body = await readOptionalJsonBody(request);
    if (body !== undefined) {
      options.body = body;
    }
  }

  try {
    const response = await papiRequest(path, options);
    return NextResponse.json(applyPagination(response, request));
  } catch (error) {
    return toPapiErrorResponse(error, fallbackMessage);
  }
}

async function handle(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const upstreamPath = buildUpstreamPath(path);

  if (!upstreamPath) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Unsupported API path.",
        },
      },
      { status: 404 },
    );
  }

  return forwardFromRequest(
    request,
    upstreamPath,
    `Failed to forward ${request.method.toUpperCase()} ${upstreamPath}.`,
  );
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
