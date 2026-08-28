import { NextResponse, type NextRequest } from "next/server";
import { buildPdfEndpointResponse } from "@/lib/pdfResponse";
import {
  getLoginSession,
  setLoginSession,
  getLoginPwSession,
  getOtpSession,
} from "@/lib/simState";
import { INDEX_FIXTURE_ID } from "@/lib/fixtures";

/**
 * GET /api/sim/download?ym=YYYYMM — session-gated PDF for every auth-family
 * host (`login`, `login_password_only`, `email_password`, `email_password_triggered`).
 *
 * Which session cookie is required is decided by the resolved pattern_type
 * (from the `x-sim-pattern-type` header proxy.ts stamps on every request).
 *
 * `?relogin=1` (login host only, per spec): the FIRST download after login
 * succeeds; that session is then marked "used" in its cookie, and any
 * subsequent `relogin=1` download bounces to 401 (simulating an expired
 * session that forces re-login) even though the cookie itself is still present.
 */
export async function GET(request: NextRequest) {
  const fixtureId = request.headers.get("x-sim-fixture") ?? INDEX_FIXTURE_ID;
  const patternType = request.headers.get("x-sim-pattern-type") ?? "index";
  const relogin = request.nextUrl.searchParams.get("relogin") === "1";

  const unauthorized = () => {
    const res = NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    res.headers.set("x-sim-fixture", fixtureId);
    res.headers.set("x-sim-pattern-type", patternType);
    return res;
  };

  if (patternType === "login") {
    const session = getLoginSession(request, fixtureId);
    if (!session) {
      return unauthorized();
    }
    if (relogin && session.used) {
      return unauthorized();
    }

    const response = await buildPdfEndpointResponse({
      searchParams: request.nextUrl.searchParams,
      fixtureId,
      patternType,
    });

    if (relogin && !session.used) {
      setLoginSession(response, fixtureId, { ...session, used: true });
    }
    return response;
  }

  if (patternType === "login_password_only") {
    const session = getLoginPwSession(request, fixtureId);
    if (!session) {
      return unauthorized();
    }
    return buildPdfEndpointResponse({ searchParams: request.nextUrl.searchParams, fixtureId, patternType });
  }

  if (patternType === "email_password" || patternType === "email_password_triggered") {
    const session = getOtpSession(request, fixtureId);
    if (!session) {
      return unauthorized();
    }
    return buildPdfEndpointResponse({ searchParams: request.nextUrl.searchParams, fixtureId, patternType });
  }

  return unauthorized();
}
