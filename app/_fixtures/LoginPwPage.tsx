"use client";

import { useState } from "react";
import { pickParams, type SP } from "@/lib/searchParams";
import { page, card, heading, label, input, button, errorText, muted, row } from "./styles";
import PopupOverlay, { resolvePopupMode } from "./PopupOverlay";
import { parseObstructions, Obstructions, useObstructionGate } from "./Obstructions";
import LangSwitcher from "./LangSwitcher";
import { t, type Lang } from "@/lib/i18n";

/**
 * `inv2-login-pw` (pattern_type: login_password_only) — modeled on HENNGE
 * single-password download. `#password` + `#login-submit` only (no username
 * field). Retry counter locks after 5 wrong passwords. File list after success.
 * `?popup=1`: DISMISSIBLE obstructing modal (`#popup-overlay` /
 * `#popup-close`) covers the form on load. `?popup=2`: PERMANENT TRAP variant
 * — see PopupOverlay.tsx. `?lang=en|ja`: UI language (default en).
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

export default function LoginPwPage({ fixtureId, searchParams, lang }: Props) {
  const dict = t(lang);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const popupMode = resolvePopupMode(searchParams);
  const obstructions = parseObstructions(searchParams);
  const { onActionClick } = useObstructionGate(obstructions, lang);
  const loginQs = pickParams(searchParams, ["wrongpin"]);
  const downloadQsBase = pickParams(searchParams, ["__host", "empty", "http500", "htmlfile", "jsonerr", "slow"]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/sim/login${loginQs ? `?${loginQs}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = (await res.json()) as { ok: boolean; error?: string };
      if (body.ok) {
        setLoggedIn(true);
      } else if (body.error === "locked") {
        setLocked(true);
        setError(dict.loginPw.errorLocked);
      } else if (body.error === "refused") {
        setError(dict.loginPw.errorRefused);
      } else {
        setError(dict.loginPw.errorInvalidPassword);
      }
    } catch {
      setError(dict.common.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={page}>
      <LangSwitcher searchParams={searchParams} lang={lang} />
      <h1 style={heading}>{dict.loginPw.heading}</h1>
      <p style={{ ...muted, marginTop: -8, marginBottom: 20 }}>
        {dict.common.fixtureLabel} {fixtureId}
      </p>

      <div style={{ ...card, position: "relative" }}>
        {popupMode.show && (
          <PopupOverlay dismissible={popupMode.dismissible} message={dict.popup.securityMessage} lang={lang} />
        )}
        <Obstructions set={obstructions} lang={lang} />
        {!loggedIn && (
          <>
            <form onSubmit={onSubmit}>
              <label htmlFor="password" style={label}>
                {dict.loginPw.passwordLabel}
              </label>
              <input
                id="password"
                type="password"
                required
                disabled={locked}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={input}
              />
              <button
                id="login-submit"
                type="submit"
                disabled={submitting || locked}
                onClick={onActionClick}
                style={button}
              >
                {submitting ? dict.loginPw.checking : dict.loginPw.open}
              </button>
            </form>
            {error && <p style={errorText}>{error}</p>}
          </>
        )}

        {loggedIn && (
          <div>
            <h2 style={{ fontSize: 16, marginTop: 0 }}>{dict.loginPw.fileList}</h2>
            {lastThreeMonths().map((ym) => {
              const params = new URLSearchParams(downloadQsBase);
              params.set("ym", ym);
              const href = `/api/sim/download?${params.toString()}`;
              return (
                <div key={ym} style={row}>
                  <span>請求書_{ym}_株式会社サンプル.pdf</span>
                  <a id={`download-${ym}`} href={href} style={{ color: "#2857c8", fontWeight: 600 }}>
                    {dict.loginPw.download}
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
