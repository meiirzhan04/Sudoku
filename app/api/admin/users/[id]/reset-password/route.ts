import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { origin } = new URL(request.url);
  const me = await fetch(`${origin}/api/users/me`, {
    headers: forwardHeaders(request),
    cache: "no-store"
  });

  if (!me.ok) return NextResponse.json({ message: "Admin sign in required" }, { status: me.status });
  const user = (await me.json().catch(() => null)) as { role?: string } | null;
  if (user?.role !== "ADMIN") return NextResponse.json({ message: "Admin access denied" }, { status: 403 });

  const backend = backendBase(request);
  if (!backend) {
    return NextResponse.json(
      { message: "Password reset is read-only until BACKEND_URL points to the updated backend admin API." },
      { status: 503 }
    );
  }

  const response = await fetch(`${backend}/api/admin/users/${params.id}/reset-password`, {
    method: "POST",
    headers: forwardHeaders(request, true),
    body: await request.text(),
    cache: "no-store"
  });

  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") ?? "application/json" }
  });
}

function forwardHeaders(request: Request, json = false) {
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const cookie = request.headers.get("cookie");
  const acceptLanguage = request.headers.get("accept-language");
  if (authorization) headers.set("authorization", authorization);
  if (cookie) headers.set("cookie", cookie);
  if (acceptLanguage) headers.set("accept-language", acceptLanguage);
  if (json) headers.set("content-type", "application/json");
  return headers;
}

function backendBase(request: Request) {
  const configured = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!configured) return null;
  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = new URL(configured).origin;
  return configuredOrigin === requestOrigin ? null : configuredOrigin;
}
