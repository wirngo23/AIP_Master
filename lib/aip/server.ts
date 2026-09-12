import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { assertSameOrigin } from "./domain";
import { ZodError } from "zod";
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export async function owner(request?: Request) {
  const user = await getChatGPTUser();
  if (!user)
    throw new HttpError(401, "Sign in to access your private workspace.");
  if (request && request.method !== "GET") {
    try {
      assertSameOrigin(request.headers.get("origin"), request.url);
    } catch {
      throw new HttpError(
        403,
        "This request must come from your AIP workspace.",
      );
    }
  }
  return user.userId;
}
export function database() {
  if (!env.DB)
    throw new HttpError(
      503,
      "Saved work is temporarily unavailable. Your current preview is still open.",
    );
  return env.DB;
}
export function bucket() {
  if (!env.BUCKET)
    throw new HttpError(503, "Photo storage is temporarily unavailable.");
  return env.BUCKET;
}
export function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export function failure(error: unknown) {
  if (error instanceof HttpError)
    return json({ error: error.message }, error.status);
  if (error instanceof ZodError)
    return json(
      { error: "Please check the required fields and permitted values." },
      400,
    );
  console.error(
    "AIP request failed",
    error instanceof Error ? error.name : "UnknownError",
  );
  return json(
    {
      error:
        "We could not complete this action. Your inputs have been kept; please try again.",
    },
    503,
  );
}
export async function limitedBody(request: Request, max: number) {
  if (Number(request.headers.get("content-length") || 0) > max)
    throw new HttpError(413, "This upload is too large.");
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw new HttpError(413, "This upload is too large.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
export async function readJson(request: Request, max = 12000) {
  const raw = await limitedBody(request, max);
  try {
    return JSON.parse(new TextDecoder().decode(raw));
  } catch {
    throw new HttpError(400, "The request could not be read.");
  }
}
