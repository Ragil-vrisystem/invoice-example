"use client";

import { useState } from "react";
import { pickParams, type SP } from "@/lib/searchParams";
import { page, card, heading, label, input, button, errorText, muted, row } from "./styles";
import PopupOverlay, { resolvePopupMode } from "./PopupOverlay";
import LangSwitcher from "./LangSwitcher";
import { t, formatMonthLabel, type Lang } from "@/lib/i18n";

/**
 * `inv2-login` (pattern_type: login) — modeled on NTT/SoftBank/KDDI corporate
 * portals. `#username` + `#password` + `#login-submit` -> POST /api/sim/login
 * -> cookie session -> invoice history (3 months) with per-month download links.
 *
 * `?wrongpin=1`: valid credentials still refused. `?relogin=1`: first download
 * succeeds, the second bounces back to the login form (session marked used
 * server-side; enforced by /api/sim/download, this page just reflects the 401).
 * `?popup=1`: a DISMISSIBLE obstructing modal (`#popup-overlay` /
 * `#popup-close`) covers the login form on load — closing it unblocks
 * `#username`/`#password`/`#login-submit` (positive test). `?popup=2`: the
 * same overlay but as a PERMANENT TRAP that never closes (negative test).
 * `?lang=en|ja`: UI language (default en).
 */

interface Props {
  fixtureId: string;
  searchParams: SP;
  lang: Lang;
}

function lastThreeMonths(): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export default function LoginPage({ fixtureId, searchParams, lang }: Props) {
  const dict = t(lang);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const popupMode = resolvePopupMode(searchParams);
  const loginQs = pickParams(searchParams, ["wrongpin"]);
  const downloadQsBase = pickParams(searchParams, ["relogin", "__host", "empty", "http500", "htmlfile", "jsonerr", "slow"]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/sim/login${loginQs ? `?${loginQs}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = (await res.json()) as { ok: boolean; error?: string };
      if (body.ok) {
        setLoggedIn(true);
        setDownloadError(null);
      } else {
        setError(body.error === "refused" ? dict.login.errorRefused : dict.login.errorInvalidCredentials);
      }
    } catch {
      setError(dict.common.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  const onDownloadClick = async (ym: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    // Intercept only to detect a bounced (401) relogin=1 session and flip the
    // UI back to the login form; otherwise let the browser navigate normally
    // so the PDF actually downloads.
    const href = e.currentTarget.href;
    try {
      const res = await fetch(href, { method: "GET" });
      if (res.status === 401) {
        e.preventDefault();
        setLoggedIn(false);
        setDownloadError(dict.login.sessionExpired);
      }
      // else: allow default navigation (already fetched once server-side
      // state change for relogin has happened; a second real navigation
      // re-issues the same successful request, which is harmless here).
    } catch {
      // network error: let default navigation attempt proceed
    }
  };

  return (
    <main style={page}>
      <LangSwitcher searchParams={searchParams} lang={lang} />
      <h1 style={heading}>{dict.login.heading}</h1>
      <p style={{ ...muted, marginTop: -8, marginBottom: 20 }}>
        {dict.common.fixtureLabel} {fixtureId}
      </p>

      <div style={{ ...card, position: "relative" }}>
        {popupMode.show && (
          <PopupOverlay dismissible={popupMode.dismissible} message={dict.popup.cookieMessage} lang={lang} />
        )}
        {!loggedIn && (
          <>
            <form onSubmit={onSubmit}>
              <label htmlFor="username" style={label}>
                {dict.login.usernameLabel}
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={input}
                placeholder="sim-user@example.test"
              />
              <label htmlFor="password" style={label}>
                {dict.login.passwordLabel}
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={input}
              />
              <button id="login-submit" type="submit" disabled={submitting} style={button}>
                {submitting ? dict.login.loggingIn : dict.login.login}
              </button>
            </form>
            {error && <p style={errorText}>{error}</p>}
            {downloadError && <p style={errorText}>{downloadError}</p>}
          </>
        )}

        {loggedIn && (
          <div>
            <h2 style={{ fontSize: 16, marginTop: 0 }}>{dict.login.invoiceHistory}</h2>
            {lastThreeMonths().map((ym) => {
              const params = new URLSearchParams(downloadQsBase);
              params.set("ym", ym);
              const href = `/api/sim/download?${params.toString()}`;
              return (
                <div key={ym} style={row}>
                  <span>{formatMonthLabel(ym, lang)}</span>
                  <a
                    id={`download-${ym}`}
                    href={href}
                    onClick={(e) => onDownloadClick(ym, e)}
                    style={{ color: "#2857c8", fontWeight: 600 }}
                  >
                    {dict.login.download}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
