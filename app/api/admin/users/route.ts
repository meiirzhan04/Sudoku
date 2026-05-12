import { NextResponse } from "next/server";

type PublicUser = {
  id: string;
  fullName?: string | null;
  username: string;
  city?: string | null;
  role?: "USER" | "ADMIN" | "PRO";
  stats?: {
    gamesPlayed?: number;
    wins?: number;
    bestTimeSeconds?: number | null;
    averageAccuracy?: number | null;
    bestStreak?: number;
  };
};

export async function GET(request: Request) {
  const adminError = await verifyAdmin(request);
  if (adminError) return adminError;

  const { searchParams, origin } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const adminBackend = backendBase(request);

  if (adminBackend) {
    const adminResponse = await proxy(`${adminBackend}/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`, request);
    if (adminResponse.status !== 404) return adminResponse;
  }

  const fallbackResponse = await proxy(`${origin}/api/users/search?username=${encodeURIComponent(query)}`, request);
  if (!fallbackResponse.ok) {
    return NextResponse.json([], {
      headers: { "x-sudokumind-admin-source": "public-search" }
    });
  }

  const users = (await fallbackResponse.json().catch(() => [])) as PublicUser[];
  return NextResponse.json(users.map(toAdminUser), {
    headers: { "x-sudokumind-admin-source": "public-search" }
  });
}

export async function POST(request: Request) {
  const adminError = await verifyAdmin(request);
  if (adminError) return adminError;

  const adminBackend = backendBase(request);
  if (!adminBackend) {
    return NextResponse.json(
      { message: "User creation is unavailable until BACKEND_URL points to the updated backend admin API." },
      { status: 503 }
    );
  }

  const response = await fetch(`${adminBackend}/api/admin/users`, {
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

function toAdminUser(user: PublicUser) {
  return {
    id: user.id,
    fullName: user.fullName ?? user.username,
    username: user.username,
    email: "Hidden until backend admin API is deployed",
    city: user.city ?? null,
    role: user.role ?? "USER",
    emailVerified: false,
    gamesPlayed: user.stats?.gamesPlayed ?? 0,
    wins: user.stats?.wins ?? 0,
    bestTimeSeconds: user.stats?.bestTimeSeconds ?? null,
    averageAccuracy: user.stats?.averageAccuracy ?? 0,
    currentStreak: user.stats?.bestStreak ?? 0,
    xp: (user.stats?.wins ?? 0) * 50,
    xpOverride: null,
    streakOverride: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

async function verifyAdmin(request: Request) {
  const { origin } = new URL(request.url);
  const response = await proxy(`${origin}/api/users/me`, request);
  if (response.status === 401) {
    return NextResponse.json({ message: "Admin sign in required" }, { status: 401 });
  }
  if (!response.ok) {
    return NextResponse.json({ message: "Could not verify admin session" }, { status: response.status });
  }
  const user = (await response.json().catch(() => null)) as { role?: string } | null;
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ message: "Admin access denied" }, { status: 403 });
  }
  return null;
}

function proxy(url: string, request: Request) {
  return fetch(url, {
    headers: forwardHeaders(request),
    cache: "no-store"
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
