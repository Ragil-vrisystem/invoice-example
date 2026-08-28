import { NextResponse, type NextRequest } from "next/server";
import { resolveFixtureId, getFixtureById } from "./lib/fixtures";
import { resolveLang } from "./lib/i18n";

/**
 * Host-header-keyed fixture routing (Next 16 "proxy" convention — the renamed
 * `middleware.ts`; same NextRequest/NextResponse API).
 *
 * Responsibilities:
 *   1. Resolve the fixture id from the Host header (or the `?__host=` curl-testing
 *      override) and stamp it, plus its pattern_type, onto BOTH the outgoing request
 *      (so pages/route handlers can read it) and the outgoing response (so every
 *      response — pages and APIs alike — carries `x-sim-fixture` / `x-sim-pattern-type`).
 *   2. Resolve the UI language the same way `?lang=en|ja` query param (always wins,
 *      also persisted to a `sim_lang` cookie) -> `sim_lang` cookie (sticky across
 *      navigation) -> English default -> stamp it as `x-sim-lang` on the request.
 *   3. For the two "no page" hosts (`inv2-direct-url`, `inv2-about-blank`), rewrite
 *      EVERY path to their single backing API route.
 *   4. Everything else passes through to normal App Router resolution
 *      (`app/page.tsx`, `app/d/[token]/page.tsx`, `app/api/**`).
 */

export function proxy(request: NextRequest): NextResponse {
  const url = request.nextUrl;
  const hostHeader = request.headers.get("host");
  const hostOverride = url.searchParams.get("__host");

  const fixtureId = resolveFixtureId(hostHeader, hostOverride);
  const fixture = getFixtureById(fixtureId);
  const patternType = fixture ? fixture.patternType : "index";

  const langQuery = url.searchParams.get("lang");
  const langCookie = request.cookies.get("sim_lang")?.value ?? null;
  const lang = resolveLang(langQuery, langCookie);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-sim-fixture", fixtureId);
  requestHeaders.set("x-sim-pattern-type", patternType);
  requestHeaders.set("x-sim-lang", lang);

  let response: NextResponse;

  if (fixtureId === "inv2-direct-url" && url.pathname !== "/api/direct-url") {
    const rewriteUrl = new URL("/api/direct-url", url);
    rewriteUrl.search = url.search;
    response = NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  } else if (fixtureId === "inv2-about-blank" && url.pathname !== "/api/about-blank") {
    const rewriteUrl = new URL("/api/about-blank", url);
    rewriteUrl.search = url.search;
    response = NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }

  response.headers.set("x-sim-fixture", fixtureId);
  response.headers.set("x-sim-pattern-type", patternType);
  response.headers.set("x-sim-lang", lang);

  // Persist an explicit ?lang= choice so it stays sticky across navigation
  // (e.g. after a login POST redirect) without needing to repeat the param.
  if (langQuery && langQuery !== langCookie) {
    response.cookies.set("sim_lang", lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
