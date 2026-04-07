import type { PapiErrorPayload } from "@/types/papi";

export class PapiHttpError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "PapiHttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function getPapiBaseUrl() {
  const target = process.env.PAPI_TARGET;

  if (!target) {
    throw new Error("Missing PAPI_TARGET environment variable");
  }

  const normalizedTarget = target.endsWith("/") ? target.slice(0, -1) : target;
  const basePath = process.env.PAPI_BASE_PATH ?? "/papi/v1/distribution";
  const normalizedBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;

  return `${normalizedTarget}${normalizedBasePath}`;
}

export type PapiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: URLSearchParams;
  body?: unknown;
  headers?: HeadersInit;
};

export async function papiRequest<T>(
  path: string,
  options: PapiRequestOptions = {},
): Promise<T> {
  const baseUrl = getPapiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${baseUrl}${normalizedPath}`);

  if (options.query) {
    url.search = options.query.toString();
  }

  const headers = new Headers(options.headers);
  headers.set("accept", "application/json");

  const bearerToken = process.env.PAPI_BEARER_TOKEN;
  if (bearerToken) {
    headers.set("authorization", `Bearer ${bearerToken}`);
  }

  let requestBody: string | undefined;
  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
    requestBody = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: requestBody,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson
    ? ((await response.json()) as T | PapiErrorPayload)
    : undefined;

  if (!response.ok) {
    const errorPayload = payload as PapiErrorPayload | undefined;
    const message =
      errorPayload?.error?.message ??
      `PAPI request failed with status ${response.status}`;

    throw new PapiHttpError(
      response.status,
      message,
      errorPayload?.error?.code,
      errorPayload?.error?.details,
    );
  }

  return payload as T;
}
