"use client";

import { useEffect, useRef, useState } from "react";
import { pickParams, type SP } from "@/lib/searchParams";
import { page, card, heading, label, input, button, buttonSecondary, errorText, dryRunBox, muted } from "./styles";
import PopupOverlay, { resolvePopupMode } from "./PopupOverlay";
import { parseObstructions, Obstructions, useObstructionGate } from "./Obstructions";
import LangSwitcher from "./LangSwitcher";
import { t, type Lang } from "@/lib/i18n";

/**
 * `inv2-email-otp` (pattern_type: email_password) — modeled on HENNGE Secure
 * Transfer. The verification code is sent automatically on page open (POST
 * fired on mount) — no user action needed to trigger it. `#code` input; the
 * submit button deliberately has NO id (kept as a trap from v1 — it's only
 * reachable via `button[type="submit"]`).
 * `?popup=1`: DISMISSIBLE obstructing modal (`#popup-overlay` /
 * `#popup-close`) covers the code form on load. `?popup=2`: PERMANENT TRAP
 * variant — see PopupOverlay.tsx. `?lang=en|ja`: UI language (default en).
 */

interface Props {
  fixtureId: string;
  searchParams: SP;
  lang: Lang;
}

export default function EmailOtpPage({ fixtureId, searchParams, lang }: Props) {
  const dict = t(lang);
  const [sent, setSent] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const sentOnce = useRef(false);

  const popupMode = resolvePopupMode(searchParams);
  const obstructions = parseObstructions(searchParams);
  const { onActionClick } = useObstructionGate(obstructions, lang);
  const verifyQs = pickParams(searchParams, ["wrongpin", "expired"]);
  const downloadQs = pickParams(searchParams, ["__host", "empty", "http500", "htmlfile", "jsonerr", "slow"]);

  useEffect(() => {
    if (sentOnce.current) return;
    sentOnce.current = true;
    (async () => {
      try {
        const res = await fetch("/api/sim/otp/send", { method: "POST" });
        const body = (await res.json()) as { ok: boolean; maskedEmail?: string };
        if (body.ok) {
          setSent(true);
          setMaskedEmail(body.maskedEmail ?? null);
        }
      } catch {
        setError(dict.emailOtp.errorSendFailed);
      }
    })();
    // Intentionally runs once on mount only (fires the auto-send POST); dict
    // is derived from a stable `lang` prop so this is safe to omit.
  }, []);

  const onResend = async () => {
    try {
      const res = await fetch("/api/sim/otp/send", { method: "POST" });
      const body = (await res.json()) as { ok: boolean; error?: string; maskedEmail?: string };
      if (body.ok) {
        setSent(true);
        setMaskedEmail(body.maskedEmail ?? null);
        setError(null);
      } else if (body.error === "cooldown") {
        setError(dict.emailOtp.errorCooldown);
      }
    } catch {
      setError(dict.common.networkError);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/sim/otp/verify${verifyQs ? `?${verifyQs}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = (await res.json()) as { ok: boolean; error?: string };
      if (body.ok) {
        setVerified(true);
      } else if (body.error === "locked") {
        setError(dict.emailOtp.errorLocked);
      } else if (body.error === "expired") {
        setError(dict.emailOtp.errorExpired);
      } else if (body.error === "refused") {
        setError(dict.emailOtp.errorRefused);
      } else {
        setError(dict.emailOtp.errorWrongCode);
      }
    } catch {
      setError(dict.common.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  const params = new URLSearchParams(downloadQs);
  const now = new Date();
  params.set("ym", `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`);
  const downloadHref = `/api/sim/download?${params.toString()}`;

  return (
    <main style={page}>
      <LangSwitcher searchParams={searchParams} lang={lang} />
      <h1 style={heading}>{dict.emailOtp.heading}</h1>
      <p style={{ ...muted, marginTop: -8, marginBottom: 20 }}>
        {dict.common.fixtureLabel} {fixtureId}
      </p>

      <div style={{ ...card, position: "relative" }}>
        {popupMode.show && (
          <PopupOverlay dismissible={popupMode.dismissible} message={dict.popup.securityMessage} lang={lang} />
        )}
        <Obstructions set={obstructions} lang={lang} />
        {!verified && (
          <>
            {sent ? (
              <div style={dryRunBox}>
                <p style={{ margin: 0, fontWeight: 600 }}>{dict.emailOtp.codeSentTitle}</p>
                <p style={{ margin: "6px 0" }}>{dict.emailOtp.dryRunNote}</p>
                {maskedEmail && (
                  <p style={{ margin: 0 }}>
                    {dict.emailOtp.sentTo} {maskedEmail}
                  </p>
                )}
              </div>
            ) : (
              <p style={muted}>{dict.emailOtp.sending}</p>
            )}

            <form onSubmit={onSubmit}>
              <label htmlFor="code" style={label}>
                {dict.emailOtp.codeLabel}
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={input}
                placeholder="123456"
              />
              {/* Deliberately no id — reachable only via button[type="submit"] */}
              <button type="submit" disabled={submitting} onClick={onActionClick} style={button}>
                {submitting ? dict.emailOtp.verifying : dict.emailOtp.verify}
              </button>
            </form>

            <button id="resend-code" type="button" onClick={onResend} style={{ ...buttonSecondary, marginLeft: 8 }}>
              {dict.emailOtp.resend}
            </button>

            {error && <p style={errorText}>{error}</p>}
          </>
        )}

        {verified && (
          <div>
            <p style={{ fontWeight: 600 }}>{dict.emailOtp.verifiedTitle}</p>
            <a id="download-invoice" href={downloadHref} style={{ color: "#2857c8", fontWeight: 600 }}>
              {dict.common.downloadInvoice}
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
