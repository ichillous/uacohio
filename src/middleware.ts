import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/modules/shared/i18n/locales";

// Keep the Edge Middleware convention while OpenNext Cloudflare does not support Node.js Proxy.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/").filter(Boolean)[0];

  if (firstSegment && isLocale(firstSegment)) {
    return NextResponse.next();
  }

  const destination = request.nextUrl.clone();
  destination.pathname = pathname === "/" ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;

  return NextResponse.redirect(destination);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
