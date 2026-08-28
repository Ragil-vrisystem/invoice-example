import type { NextRequest, NextResponse } from "next/server";

/**
 * Cookie-based (no DB) interactive-flow state for the auth-family fixture hosts:
 * login sessions, login-password-only retry counter, OTP issuance/attempts, and
 * short-lived link tokens for the email-gated variant-B one-time link.
 *
 * Every cookie is httpOnly and scoped per fixture id (the cookie name embeds the
 * fixture id) so multiple hosts tested against the same origin (e.g. via the
 * `?__host=` curl override, which shares one real origin/cookie-jar) never
 * collide with each other's state.
 */

// ---- Hard-coded dummy credentials / fixed OTP code (never real) ----------

export const SIM_CREDENTIALS = {
  username: "sim-user@example.test",
  password: "sim-password-2026",
} as const;

export const OTP_FIXED_CODE = "424242";
export const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
export const OTP_MAX_ATTEMPTS = 5;

export const LOGIN_PW_MAX_ATTEMPTS = 5;

const SESSION_MAX_AGE_SECONDS = 60 * 60; // 1 hour
const OTP_STATE_MAX_AGE_SECONDS = 60 * 60; // 1 hour (well past the 10 min code expiry)
const ATTEMPTS_MAX_AGE_SECONDS = 60 * 60 * 24; // 1 day — "lock after 5 failures" persists

// ---- generic cookie JSON helpers ------------------------------------------

function cookieName(kind: string, fixtureId: string): string {
  return `sim_${kind}_${fixtureId}`;
}

function readJsonCookie<T>(request: NextRequest, name: string): T | null {
  const raw = request.cookies.get(name)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJsonCookie(response: NextResponse, name: string, value: unknown, maxAgeSeconds: number): void {
  response.cookies.set(name, JSON.stringify(value), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

function clearCookie(response: NextResponse, name: string): void {
  response.cookies.set(name, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function randomToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

// ---- Login (username + password) session ----------------------------------

export interface LoginSessionState {
  token: string;
  createdAt: number;
  /** marked true once a download has been consumed under ?relogin=1 semantics */
  used: boolean;
}

export function getLoginSession(request: NextRequest, fixtureId: string): LoginSessionState | null {
  return readJsonCookie<LoginSessionState>(request, cookieName("login", fixtureId));
}

export function setLoginSession(response: NextResponse, fixtureId: string, state: LoginSessionState): void {
  writeJsonCookie(response, cookieName("login", fixtureId), state, SESSION_MAX_AGE_SECONDS);
}

export function createLoginSession(response: NextResponse, fixtureId: string): LoginSessionState {
  const state: LoginSessionState = { token: randomToken(), createdAt: Date.now(), used: false };
  setLoginSession(response, fixtureId, state);
  return state;
}

export function clearLoginSession(response: NextResponse, fixtureId: string): void {
  clearCookie(response, cookieName("login", fixtureId));
}

// ---- Login (password-only) attempts + session ------------------------------

export interface AttemptsState {
  attempts: number;
}

export function getLoginPwAttempts(request: NextRequest, fixtureId: string): AttemptsState {
  return readJsonCookie<AttemptsState>(request, cookieName("loginpw_attempts", fixtureId)) ?? { attempts: 0 };
}

export function setLoginPwAttempts(response: NextResponse, fixtureId: string, state: AttemptsState): void {
  writeJsonCookie(response, cookieName("loginpw_attempts", fixtureId), state, ATTEMPTS_MAX_AGE_SECONDS);
}

export interface SimpleSessionState {
  token: string;
  createdAt: number;
}

export function getLoginPwSession(request: NextRequest, fixtureId: string): SimpleSessionState | null {
  return readJsonCookie<SimpleSessionState>(request, cookieName("loginpw_session", fixtureId));
}

export function createLoginPwSession(response: NextResponse, fixtureId: string): SimpleSessionState {
  const state: SimpleSessionState = { token: randomToken(), createdAt: Date.now() };
  writeJsonCookie(response, cookieName("loginpw_session", fixtureId), state, SESSION_MAX_AGE_SECONDS);
  return state;
}

// ---- Email + OTP (both auto-send and trigger variants share this shape) ---

export interface OtpState {
  issuedAt: number;
  lastSendAt: number;
  attempts: number;
  locked: boolean;
}

export function getOtpState(request: NextRequest, fixtureId: string): OtpState | null {
  return readJsonCookie<OtpState>(request, cookieName("otp", fixtureId));
}

export function setOtpState(response: NextResponse, fixtureId: string, state: OtpState): void {
  writeJsonCookie(response, cookieName("otp", fixtureId), state, OTP_STATE_MAX_AGE_SECONDS);
}

export function issueOtpState(response: NextResponse, fixtureId: string): OtpState {
  const now = Date.now();
  const state: OtpState = { issuedAt: now, lastSendAt: now, attempts: 0, locked: false };
  setOtpState(response, fixtureId, state);
  return state;
}

export function getOtpSession(request: NextRequest, fixtureId: string): SimpleSessionState | null {
  return readJsonCookie<SimpleSessionState>(request, cookieName("otp_session", fixtureId));
}

export function createOtpSession(response: NextResponse, fixtureId: string): SimpleSessionState {
  const state: SimpleSessionState = { token: randomToken(), createdAt: Date.now() };
  writeJsonCookie(response, cookieName("otp_session", fixtureId), state, SESSION_MAX_AGE_SECONDS);
  return state;
}

// ---- Short-lived link token (email-gated variant B one-time link) ---------
//
// Not cryptographically signed — this is a simulation fixture, not a security
// boundary. Single-use is NOT enforced (no DB to record consumption); only the
// expiry timestamp embedded in the token is checked. Documented in README.

export interface LinkTokenPayload {
  issuedAt: number;
  expiresAt: number;
  n: number;
}

export function encodeLinkToken(payload: LinkTokenPayload): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json, "utf-8").toString("base64url");
}

export function decodeLinkToken(token: string): LinkTokenPayload | null {
  try {
    const json = Buffer.from(token, "base64url").toString("utf-8");
    const payload = JSON.parse(json) as LinkTokenPayload;
    if (
      typeof payload.issuedAt === "number" &&
      typeof payload.expiresAt === "number" &&
      typeof payload.n === "number"
    ) {
      return payload;
    }
    return null;
  } catch {
    return null;
  }
}

export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "s***@example.test";
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const visible = local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(local.length - 1, 3))}${domain}`;
}
