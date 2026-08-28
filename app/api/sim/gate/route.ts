import { NextResponse, type NextRequest } from "next/server";
import { encodeLinkToken } from "@/lib/simState";
import { INDEX_FIXTURE_ID } from "@/lib/fixtures";

/**
 * POST /api/sim/gate — `inv2-email-gated` host.
 *
 * Variant A (default): any well-formed email reveals the download immediately.
 * Variant B (`?variant=b`): a one-time link is "mailed" (dry-run: returned inline
 * in the response body, clearly labeled) pointing at `/d/<token>`; the token
 * embeds an expiry timestamp checked by `/d/[token]`. Single-use is NOT enforced
 * (no DB) — see README.
 *
 * Failure params: `?wrongpin=1` refuses even a well-formed email. `?expired=1`
 * (variant B only) issues an already-expired link, for testing the expiry path.
 */
export async function POST(request: NextRequest) {
  const fixtureId = request.headers.get("x-sim-fixture") ?? INDEX_FIXTURE_ID;
  const patternType = request.headers.get("x-sim-pattern-type") ?? "index";
  const url = request.nextUrl;
  const variant = url.searchParams.get("variant") === "b" ? "b" : "a";
  const wrongpin = url.searchParams.get("wrongpin") === "1";
  const expired = url.searchParams.get("expired") === "1";

  let email = "";
  try {
    const body = await request.json();
    if (body && typeof body.email === "string") {
      email = body.email;
    }
  } catch {
    // malformed body -> treated as invalid email below
  }

  const respond = (body: unknown, status = 200) => {
    const res = NextResponse.json(body, { status });
    res.headers.set("x-sim-fixture", fixtureId);
    res.headers.set("x-sim-pattern-type", patternType);
    return res;
  };

  if (!email || !email.includes("@")) {
    return respond({ ok: false, error: "invalid_email" }, 400);
  }

  if (wrongpin) {
    return respond({ ok: false, error: "refused" }, 401);
  }

  if (variant === "b") {
    const now = Date.now();
    const expiresAt = expired ? now - 1000 : now + 15 * 60 * 1000;
    const token = encodeLinkToken({ issuedAt: now, expiresAt, n: 1 });
    return respond({
      ok: true,
      variant: "b",
      dryRun: true,
      link: `/d/${token}`,
      expiresAt,
    });
  }

  return respond({ ok: true, variant: "a" });
}
