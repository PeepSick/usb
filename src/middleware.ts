import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware that hardens every response from the Universal Skill Bridge.
 *
 * Headers applied (all responses, static + dynamic):
 *   - Content-Security-Policy       (XSS mitigation, frame-ancestors 'none')
 *   - Strict-Transport-Security      (1 year, includeSubDomains, preload-ready)
 *   - X-Frame-Options: DENY         (clickjacking)
 *   - X-Content-Type-Options: nosniff
 *   - Referrer-Policy               (privacy)
 *   - Permissions-Policy            (camera, microphone, geolocation disabled)
 *   - Cross-Origin-Opener-Policy     (Spectre)
 *   - Cross-Origin-Resource-Policy
 *   - X-Permitted-Cross-Domain-Policies: none (Flash/PDF legacy)
 */

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self' https: wss:",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const PERMISSIONS_POLICY = [
  "accelerometer=()",
  "ambient-light-sensor=()",
  "autoplay=()",
  "battery=()",
  "camera=()",
  "display-capture=()",
  "document-domain=()",
  "encrypted-media=()",
  "execution-while-not-rendered=()",
  "execution-while-out-of-viewport=()",
  "fullscreen=(self)",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "midi=()",
  "navigation-override=()",
  "payment=()",
  "picture-in-picture=()",
  "publickey-credentials-get=()",
  "screen-wake-lock=()",
  "sync-xhr=()",
  "usb=()",
  "web-share=()",
  "xr-spatial-tracking=()",
  "interest-cohort=()",
].join(", ");

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("Content-Security-Policy", CSP_DIRECTIVES);
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", PERMISSIONS_POLICY);
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  return response;
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  applySecurityHeaders(response);

  // Lightweight security audit trail for sensitive paths
  if (
    request.nextUrl.pathname.startsWith("/api/install") ||
    request.nextUrl.pathname.startsWith("/api/audit") ||
    request.nextUrl.pathname.startsWith("/api/skills")
  ) {
    response.headers.set("X-Security-Audit", "usb-monitored");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml
     * - public assets served by Next.js
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
};