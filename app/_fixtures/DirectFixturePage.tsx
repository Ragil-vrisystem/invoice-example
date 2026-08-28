"use client";

import { useEffect, useState } from "react";
import { spGet, spFlag, spHas, pickParams, type SP } from "@/lib/searchParams";
import { page, card, heading, row, muted } from "./styles";
import PopupOverlay, { resolvePopupMode } from "./PopupOverlay";
import LangSwitcher from "./LangSwitcher";
import { t, formatEndOfMonth, formatYen, type Lang } from "@/lib/i18n";

/**
 * `inv2-direct` (pattern_type: direct) — modeled on the Bill One
 * registered-recipient flow. Invoice preview box + `#download-invoice` button.
 *
 * Composable failure-mode query params:
 *   ?empty=1 / ?http500=1 / ?htmlfile=1 / ?jsonerr=1 -> forwarded to the PDF link
 *   ?popup=1     -> DISMISSIBLE obstructing overlay (#popup-overlay/#popup-close);
 *                   closing it unblocks the download button (positive test)
 *   ?popup=2     -> PERMANENT TRAP overlay; closing it does nothing, download
 *                   must still fail (negative test) — see PopupOverlay.tsx
 *   ?selector=v2 -> button becomes `<a class="dl-link-v2">` with NO id
 *   ?multi=N     -> N (<=10) buttons `#download-invoice-1..N`, distinct invoice numbers
 *   ?slow=S      -> button renders only after S (<=120) seconds
 *   ?expired=1   -> expired page, no button at all
 *   ?lang=en|ja  -> UI language (default en)
 */

const DOWNLOAD_FORWARD_KEYS = ["empty", "http500", "htmlfile", "jsonerr", "n", "ym", "__host"];

interface Props {
  fixtureId: string;
  searchParams: SP;
  token?: string;
  lang: Lang;
}

function buildDownloadHref(sp: SP, extraN?: number): string {
  const params = new URLSearchParams(pickParams(sp, DOWNLOAD_FORWARD_KEYS));
  if (extraN !== undefined) {
    params.set("n", String(extraN));
  }
  const qs = params.toString();
  return `/api/invoice.pdf${qs ? `?${qs}` : ""}`;
}

export default function DirectFixturePage({ fixtureId, searchParams, token, lang }: Props) {
  const dict = t(lang);
  const expired = spFlag(searchParams, "expired");
  const popupMode = resolvePopupMode(searchParams);
  const selectorV2 = spGet(searchParams, "selector") === "v2";
  const multiParam = spGet(searchParams, "multi");
  const multiN = multiParam ? Math.max(1, Math.min(10, Number(multiParam) || 1)) : 0;
  const slowParam = spGet(searchParams, "slow");
  const slowSeconds = slowParam ? Math.max(0, Math.min(120, Number(slowParam) || 0)) : 0;

  const [buttonVisible, setButtonVisible] = useState(slowSeconds === 0);

  useEffect(() => {
    if (slowSeconds > 0) {
      const timer = setTimeout(() => setButtonVisible(true), slowSeconds * 1000);
      return () => clearTimeout(timer);
    }
  }, [slowSeconds]);

  const invoiceNumberBase = spHas(searchParams, "n") ? Number(spGet(searchParams, "n")) : 1;
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const invNo = (n: number) => `INV2-${ym}-${String(n).padStart(5, "0")}`;

  return (
    <main style={page}>
      <LangSwitcher searchParams={searchParams} lang={lang} />
      <h1 style={heading}>{dict.direct.heading}</h1>
      <p style={{ ...muted, marginTop: -8, marginBottom: 20 }}>
        {dict.common.fixtureLabel} {fixtureId}
        {token ? ` / token: ${token}` : ""}
      </p>

      {expired ? (
        <div style={card}>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#b3261e" }}>{dict.direct.expiredTitle}</p>
          <p style={muted}>{dict.direct.expiredBody}</p>
        </div>
      ) : (
        <div style={{ ...card, position: "relative" }}>
          <div style={row}>
            <span style={muted}>{dict.direct.issuer}</span>
            <span>{dict.common.issuerName}</span>
          </div>
          <div style={row}>
            <span style={muted}>{dict.direct.invoiceNumber}</span>
            <span>{invNo(invoiceNumberBase)}</span>
          </div>
          <div style={row}>
            <span style={muted}>{dict.direct.amount}</span>
            <span>{formatYen(30000 + invoiceNumberBase * 1000, lang)}</span>
          </div>
          <div style={{ ...row, borderBottom: "none" }}>
            <span style={muted}>{dict.direct.deadline}</span>
            <span>{formatEndOfMonth(now.getFullYear(), now.getMonth() + 2, lang)}</span>
          </div>

          <div style={{ marginTop: 20 }}>
            {!buttonVisible && <p style={muted}>{dict.direct.preparingButton}</p>}

            {buttonVisible && multiN > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Array.from({ length: multiN }, (_, i) => i + 1).map((i) => (
                  <a
                    key={i}
                    id={`download-invoice-${i}`}
                    href={buildDownloadHref(searchParams, i)}
                    style={{ color: "#2857c8", fontWeight: 600 }}
                  >
                    {dict.direct.downloadInvoiceNamed(invNo(i))}
                  </a>
                ))}
              </div>
            )}

            {buttonVisible && multiN === 0 && selectorV2 && (
              <a className="dl-link-v2" href={buildDownloadHref(searchParams)} style={{ color: "#2857c8", fontWeight: 600 }}>
                {dict.common.downloadInvoice}
              </a>
            )}

            {buttonVisible && multiN === 0 && !selectorV2 && (
              <a
                id="download-invoice"
                href={buildDownloadHref(searchParams)}
                style={{ color: "#2857c8", fontWeight: 600 }}
              >
                {dict.common.downloadInvoice}
              </a>
            )}
          </div>

          {popupMode.show && <PopupOverlay dismissible={popupMode.dismissible} lang={lang} />}
        </div>
      )}
    </main>
  );
}
