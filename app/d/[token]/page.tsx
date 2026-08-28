import { headers } from "next/headers";
import { getFixtureById, INDEX_FIXTURE_ID } from "@/lib/fixtures";
import { decodeLinkToken } from "@/lib/simState";
import { pickParams, type SP } from "@/lib/searchParams";
import { t, DEFAULT_LANG, isLang } from "@/lib/i18n";
import DirectFixturePage from "@/app/_fixtures/DirectFixturePage";
import IndexPage from "@/app/_fixtures/IndexPage";
import LangSwitcher from "@/app/_fixtures/LangSwitcher";
import { page, card, muted } from "@/app/_fixtures/styles";

/**
 * Tokenized direct-host URL, `/d/<token>`.
 *
 *  - `inv2-direct`: same page as `/`, token is cosmetic (invoice preview + `#download-invoice`).
 *  - `inv2-email-gated` (variant B one-time link): the token embeds a real expiry
 *    timestamp — expired tokens show an expired message, valid ones reveal the
 *    download immediately (no need to re-enter the email; the link itself is the credential).
 *  - any other host: falls back to the fixture index.
 */

export default async function TokenPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<SP>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const hdrs = await headers();
  const fixtureId = hdrs.get("x-sim-fixture") ?? INDEX_FIXTURE_ID;
  const langHeader = hdrs.get("x-sim-lang");
  const lang = isLang(langHeader) ? langHeader : DEFAULT_LANG;
  const dict = t(lang);
  const fixture = getFixtureById(fixtureId);

  if (!fixture) {
    return <IndexPage lang={lang} searchParams={sp} />;
  }

  if (fixture.patternType === "direct") {
    return <DirectFixturePage fixtureId={fixtureId} searchParams={sp} token={token} lang={lang} />;
  }

  if (fixture.patternType === "email_gated") {
    const payload = decodeLinkToken(token);
    const downloadQs = pickParams(sp, ["__host"]);
    const downloadHref = `/api/invoice.pdf${downloadQs ? `?${downloadQs}` : ""}`;

    if (!payload) {
      return (
        <main style={page}>
          <LangSwitcher searchParams={sp} lang={lang} />
          <div style={card}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#b3261e" }}>{dict.tokenPage.invalidTitle}</p>
            <p style={muted}>{dict.tokenPage.invalidBody}</p>
          </div>
        </main>
      );
    }

    if (Date.now() > payload.expiresAt) {
      return (
        <main style={page}>
          <LangSwitcher searchParams={sp} lang={lang} />
          <div style={card}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#b3261e" }}>{dict.tokenPage.expiredTitle}</p>
            <p style={muted}>{dict.tokenPage.expiredBody}</p>
          </div>
        </main>
      );
    }

    return (
      <main style={page}>
        <LangSwitcher searchParams={sp} lang={lang} />
        <div style={card}>
          <p style={{ fontSize: 16, fontWeight: 600, marginTop: 0 }}>{dict.tokenPage.readyTitle}</p>
          <a id="download-invoice" href={downloadHref} style={{ color: "#2857c8", fontWeight: 600 }}>
            {dict.common.downloadInvoice}
          </a>
        </div>
      </main>
    );
  }

  return <IndexPage lang={lang} searchParams={sp} />;
}
