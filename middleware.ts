import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/profile", "/settings", "/daily", "/friends", "/multiplayer"];

export function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const isProtected = protectedRoutes.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!isProtected) {
    return response;
  }

  const hasBackendToken = Boolean(request.cookies.get("sm_access_token")?.value);
  if (hasBackendToken) {
    return response;
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
