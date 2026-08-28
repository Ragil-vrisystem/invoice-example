import { NextResponse, type NextRequest } from "next/server";
import { getOtpState, issueOtpState, OTP_RESEND_COOLDOWN_MS, maskEmail, SIM_CREDENTIALS } from "@/lib/simState";
import { INDEX_FIXTURE_ID } from "@/lib/fixtures";

/**
 * POST /api/sim/otp/send — issues (or re-issues) the fixed dry-run code
 * (424242) for both OTP hosts (`inv2-email-otp` auto-sends this on page
 * mount; `inv2-email-otp-trigger` fires it only when `#send-code` is pressed).
 *
 * Resend cooldown: 60s from the previous send — a resend attempted sooner
 * is refused with 429. A successful (re)send resets the wrong-code attempt
 * counter and lock state (a fresh code means a fresh set of attempts).
 */
export async function POST(request: NextRequest) {
  const fixtureId = request.headers.get("x-sim-fixture") ?? INDEX_FIXTURE_ID;
  const patternType = request.headers.get("x-sim-pattern-type") ?? "index";

  const respond = (body: unknown, status: number) => {
    const res = NextResponse.json(body, { status });
    res.headers.set("x-sim-fixture", fixtureId);
    res.headers.set("x-sim-pattern-type", patternType);
    return res;
  };

  const existing = getOtpState(request, fixtureId);
  if (existing) {
    const elapsed = Date.now() - existing.lastSendAt;
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      return respond(
        { ok: false, error: "cooldown", retryAfterMs: OTP_RESEND_COOLDOWN_MS - elapsed },
        429,
      );
    }
  }

  const res = respond({ ok: true, maskedEmail: maskEmail(SIM_CREDENTIALS.username), dryRun: true }, 200);
  issueOtpState(res, fixtureId);
  return res;
}
