"use client";

import { useState } from "react";
import { pickParams, type SP } from "@/lib/searchParams";
import { page, card, heading, label, input, button, errorText, dryRunBox, muted } from "./styles";
import PopupOverlay, { resolvePopupMode } from "./PopupOverlay";
import { parseObstructions, Obstructions, useObstructionGate } from "./Obstructions";
import LangSwitcher from "./LangSwitcher";
import { t, type Lang } from "@/lib/i18n";

/**
 * `inv2-email-gated` (pattern_type: email_gated) — synthetic, Hajimari-shaped.
 * `#gate-email` + `#gate-submit` -> POST /api/sim/gate.
 *   Variant A (default): reveals `#download-invoice` inline.
 *   Variant B (`?variant=b`): shows a dry-run one-time link block instead.
 * `?wrongpin=1` refuses even a valid-looking email. `?expired=1` (variant B)
 * issues an already-expired link. `?popup=1`: DISMISSIBLE obstructing modal
 * (`#popup-overlay` / `#popup-close`) covers the form on load. `?popup=2`:
 * PERMANENT TRAP variant — see PopupOverlay.tsx. `?lang=en|ja`: UI language.
 */

interface Props {
  fixtureId: string;
  searchParams: SP;
  lang: Lang;
}

type GateResult =
  | { ok: true; variant: "a" }
  | { ok: true; variant: "b"; link: string; dryRun: true }
  | { ok: false; error: string };

export default function EmailGatedPage({ fixtureId, searchParams, lang }: Props) {
  const dict = t(lang);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const popupMode = resolvePopupMode(searchParams);
  const obstructions = parseObstructions(searchParams);
  const { onActionClick } = useObstructionGate(obstructions, lang);
  const qs = pickParams(searchParams, ["variant", "wrongpin", "expired"]);
  const downloadHref = `/api/invoice.pdf${pickParams(searchParams, ["__host"]) ? `?${pickParams(searchParams, ["__host"])}` : ""}`;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/sim/gate${qs ? `?${qs}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await res.json()) as GateResult;
      setResult(body);
      if (!body.ok) {
        setError(body.error === "refused" ? dict.emailGated.errorRefused : dict.emailGated.errorInvalidEmail);
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
      <h1 style={heading}>{dict.emailGated.heading}</h1>
      <p style={{ ...muted, marginTop: -8, marginBottom: 20 }}>
        {dict.common.fixtureLabel} {fixtureId}
      </p>

      <div style={{ ...card, position: "relative" }}>
        {popupMode.show && (
          <PopupOverlay dismissible={popupMode.dismissible} message={dict.popup.cookieMessage} lang={lang} />
        )}
        <Obstructions set={obstructions} lang={lang} />
        <form onSubmit={onSubmit}>
          <label htmlFor="gate-email" style={label}>
            {dict.emailGated.emailLabel}
          </label>
          <input
            id="gate-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
            placeholder="you@example.test"
          />
          <button id="gate-submit" type="submit" disabled={submitting} onClick={onActionClick} style={button}>
            {submitting ? dict.emailGated.verifying : dict.emailGated.verify}
          </button>
        </form>

        {error && <p style={errorText}>{error}</p>}

        {result?.ok && result.variant === "a" && (
          <div style={{ marginTop: 20, borderTop: "1px solid #f0f1f3", paddingTop: 16 }}>
            <a id="download-invoice" href={downloadHref} style={{ color: "#2857c8", fontWeight: 600 }}>
              {dict.common.downloadInvoice}
            </a>
          </div>
        )}

        {result?.ok && result.variant === "b" && (
          <div style={dryRunBox}>
            <p style={{ margin: 0, fontWeight: 600 }}>{dict.emailGated.linkSentTitle}</p>
            <p style={{ margin: "6px 0" }}>{dict.emailGated.dryRunNote}</p>
            <p style={{ margin: 0 }}>
              <a id="magic-link" href={result.link} style={{ color: "#2857c8" }}>
                {result.link}
              </a>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
