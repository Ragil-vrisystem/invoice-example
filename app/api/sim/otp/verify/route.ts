import { NextResponse, type NextRequest } from "next/server";
import {
  getOtpState,
  setOtpState,
  createOtpSession,
  OTP_FIXED_CODE,
  OTP_EXPIRY_MS,
  OTP_MAX_ATTEMPTS,
} from "@/lib/simState";
import { INDEX_FIXTURE_ID } from "@/lib/fixtures";

/**
 * POST /api/sim/otp/verify — body { code }. Fixed correct code is 424242.
 *
 *   `?wrongpin=1`: the correct code is still refused (does not count against
 *   the attempt limit — it's a forced-refusal test path, not a wrong guess).
 *   `?expired=1`: forces the "already expired" response regardless of the
 *   real issuedAt clock (also enforced for real once OTP_EXPIRY_MS elapses).
 *   Wrong-code limit: OTP_MAX_ATTEMPTS (5) — locks the code after that.
 */
export async function POST(request: NextRequest) {
  const fixtureId = request.headers.get("x-sim-fixture") ?? INDEX_FIXTURE_ID;
  const patternType = request.headers.get("x-sim-pattern-type") ?? "index";
  const wrongpin = request.nextUrl.searchParams.get("wrongpin") === "1";
  const forceExpired = request.nextUrl.searchParams.get("expired") === "1";

  const respond = (body: unknown, status: number) => {
    const res = NextResponse.json(body, { status });
    res.headers.set("x-sim-fixture", fixtureId);
    res.headers.set("x-sim-pattern-type", patternType);
    return res;
  };

  let code = "";
  try {
    const body = await request.json();
    code = typeof body?.code === "string" ? body.code : "";
  } catch {
    // ignore, treated as invalid below
  }

  const state = getOtpState(request, fixtureId);
  if (!state) {
    return respond({ ok: false, error: "not_issued" }, 400);
  }

  const genuinelyExpired = Date.now() - state.issuedAt > OTP_EXPIRY_MS;
  if (forceExpired || genuinelyExpired) {
    return respond({ ok: false, error: "expired" }, 410);
  }

  if (state.locked || state.attempts >= OTP_MAX_ATTEMPTS) {
    return respond({ ok: false, error: "locked" }, 423);
  }

  if (wrongpin) {
    return respond({ ok: false, error: "refused" }, 401);
  }

  if (code !== OTP_FIXED_CODE) {
    const nextAttempts = state.attempts + 1;
    const locked = nextAttempts >= OTP_MAX_ATTEMPTS;
    const res = respond(
      locked
        ? { ok: false, error: "locked" }
        : { ok: false, error: "wrong_code", attemptsRemaining: OTP_MAX_ATTEMPTS - nextAttempts },
      locked ? 423 : 401,
    );
    setOtpState(res, fixtureId, { ...state, attempts: nextAttempts, locked });
    return res;
  }

  const res = respond({ ok: true }, 200);
  createOtpSession(res, fixtureId);
  return res;
}
