"use client";

import { useState } from "react";
import { pickParams, type SP } from "@/lib/searchParams";
import { page, card, heading, label, input, button, errorText, dryRunBox, muted } from "./styles";
import PopupOverlay, { resolvePopupMode } from "./PopupOverlay";
import LangSwitcher from "./LangSwitcher";
import { t, type Lang } from "@/lib/i18n";

/**
 * `inv2-email-otp-trigger` (pattern_type: email_password_triggered) — HENNGE
 * tenant variant. The landing page has `#send-code` (認証コードを送信 /
 * "Send verification code") and MUST NOT render any element with id="code"
 * until that button is pressed — this is intentional (a selector check
 * against the landing page correctly MISSES `#code`, it is not a
 * misconfiguration). After pressing, the masked recipient email appears and
 * `#code` is rendered for the first time.
 * `?popup=1`: DISMISSIBLE obstructing modal (`#popup-overlay` /
 * `#popup-close`) covers `#send-code` on load. `?popup=2`: PERMANENT TRAP
 * variant. Neither ever adds an `id="code"` element itself, so the
 * no-#code-until-pressed contract above always holds. `?lang=en|ja`: UI
 * language (default en) — same contract holds regardless of language.
 */

interface Props {
  fixtureId: string;
  searchParams: SP;
  lang: Lang;
}

export default function EmailOtpTriggerPage({ fixtureId, searchParams, lang }: Props) {
  const dict = t(lang);
  const [triggered, setTriggered] = useState(false);
  const [sending, setSending] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const popupMode = resolvePopupMode(searchParams);
  const verifyQs = pickParams(searchParams, ["wrongpin", "expired"]);
  const downloadQs = pickParams(searchParams, ["__host", "empty", "http500", "htmlfile", "jsonerr", "slow"]);

  const onSendCode = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/sim/otp/send", { method: "POST" });
      const body = (await res.json()) as { ok: boolean; maskedEmail?: string; error?: string };
      if (body.ok) {
        setTriggered(true);
        setMaskedEmail(body.maskedEmail ?? null);
      } else if (body.error === "cooldown") {
        setError(dict.emailOtp.errorCooldown);
      }
    } catch {
      setError(dict.common.networkError);
    } finally {
      setSending(false);
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
      <h1 style={heading}>{dict.emailOtpTrigger.heading}</h1>
      <p style={{ ...muted, marginTop: -8, marginBottom: 20 }}>
        {dict.common.fixtureLabel} {fixtureId}
      </p>

      <div style={{ ...card, position: "relative" }}>
        {popupMode.show && (
          <PopupOverlay dismissible={popupMode.dismissible} message={dict.popup.cookieMessage} lang={lang} />
        )}
        {!verified && !triggered && (
          <>
            <p style={muted}>{dict.emailOtpTrigger.intro}</p>
            <button id="send-code" type="button" onClick={onSendCode} disabled={sending} style={button}>
              {sending ? dict.emailOtpTrigger.sending : dict.emailOtpTrigger.sendCode}
            </button>
            {error && <p style={errorText}>{error}</p>}
          </>
        )}

        {!verified && triggered && (
          <>
            <div style={dryRunBox}>
              <p style={{ margin: 0, fontWeight: 600 }}>{dict.emailOtp.codeSentTitle}</p>
              <p style={{ margin: "6px 0" }}>{dict.emailOtp.dryRunNote}</p>
              {maskedEmail && (
                <p style={{ margin: 0 }}>
                  {dict.emailOtp.sentTo} {maskedEmail}
                </p>
              )}
            </div>

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
              <button id="otp-submit" type="submit" disabled={submitting} style={button}>
                {submitting ? dict.emailOtp.verifying : dict.emailOtp.verify}
              </button>
            </form>

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
