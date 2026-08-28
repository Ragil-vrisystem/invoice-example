import { NextResponse, type NextRequest } from "next/server";
import {
  SIM_CREDENTIALS,
  LOGIN_PW_MAX_ATTEMPTS,
  createLoginSession,
  getLoginPwAttempts,
  setLoginPwAttempts,
  createLoginPwSession,
} from "@/lib/simState";
import { INDEX_FIXTURE_ID } from "@/lib/fixtures";

/**
 * POST /api/sim/login — handles both auth flavors, branching on the resolved
 * pattern_type:
 *
 *   `login` (inv2-login): body { username, password }. `?wrongpin=1` refuses
 *   even the correct dummy credentials.
 *
 *   `login_password_only` (inv2-login-pw): body { password } only. A retry
 *   counter cookie locks the host after LOGIN_PW_MAX_ATTEMPTS wrong passwords
 *   (further attempts refused even with the correct password, until the
 *   cookie is cleared — no DB, no reset endpoint).
 */
export async function POST(request: NextRequest) {
  const fixtureId = request.headers.get("x-sim-fixture") ?? INDEX_FIXTURE_ID;
  const patternType = request.headers.get("x-sim-pattern-type") ?? "index";
  const wrongpin = request.nextUrl.searchParams.get("wrongpin") === "1";

  const respond = (body: unknown, status: number) => {
    const res = NextResponse.json(body, { status });
    res.headers.set("x-sim-fixture", fixtureId);
    res.headers.set("x-sim-pattern-type", patternType);
    return res;
  };

  let parsedBody: Record<string, unknown> = {};
  try {
    parsedBody = await request.json();
  } catch {
    // ignore, treated as invalid below
  }

  if (patternType === "login_password_only") {
    const password = typeof parsedBody.password === "string" ? parsedBody.password : "";

    const attemptsState = getLoginPwAttempts(request, fixtureId);
    if (attemptsState.attempts >= LOGIN_PW_MAX_ATTEMPTS) {
      return respond({ ok: false, error: "locked" }, 423);
    }

    const passwordMatches = password === SIM_CREDENTIALS.password;

    if (!passwordMatches) {
      const res = respond({ ok: false, error: "invalid_password" }, 401);
      setLoginPwAttempts(res, fixtureId, { attempts: attemptsState.attempts + 1 });
      return res;
    }

    if (wrongpin) {
      return respond({ ok: false, error: "refused" }, 401);
    }

    const res = respond({ ok: true }, 200);
    createLoginPwSession(res, fixtureId);
    return res;
  }

  // default: `login` (username + password)
  const username = typeof parsedBody.username === "string" ? parsedBody.username : "";
  const password = typeof parsedBody.password === "string" ? parsedBody.password : "";
  const credentialsMatch = username === SIM_CREDENTIALS.username && password === SIM_CREDENTIALS.password;

  if (!credentialsMatch) {
    return respond({ ok: false, error: "invalid_credentials" }, 401);
  }

  if (wrongpin) {
    return respond({ ok: false, error: "refused" }, 401);
  }

  const res = respond({ ok: true }, 200);
  createLoginSession(res, fixtureId);
  return res;
}
