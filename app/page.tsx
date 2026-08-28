import { headers } from "next/headers";
import { getFixtureById, INDEX_FIXTURE_ID } from "@/lib/fixtures";
import type { SP } from "@/lib/searchParams";
import { DEFAULT_LANG, isLang } from "@/lib/i18n";
import IndexPage from "./_fixtures/IndexPage";
import DirectFixturePage from "./_fixtures/DirectFixturePage";
import EmailGatedPage from "./_fixtures/EmailGatedPage";
import LoginPage from "./_fixtures/LoginPage";
import LoginPwPage from "./_fixtures/LoginPwPage";
import EmailOtpPage from "./_fixtures/EmailOtpPage";
import EmailOtpTriggerPage from "./_fixtures/EmailOtpTriggerPage";

/**
 * Single dispatch point: resolves which fixture proxy.ts decided this request
 * belongs to (via the `x-sim-fixture` / `x-sim-pattern-type` request headers)
 * and renders the matching pattern page component. Also resolves the UI
 * language (`x-sim-lang`, stamped by proxy.ts) and passes it down.
 *
 * `inv2-direct-url` and `inv2-about-blank` never reach here — proxy.ts
 * rewrites every path under those hosts straight to their API route.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const hdrs = await headers();
  const fixtureId = hdrs.get("x-sim-fixture") ?? INDEX_FIXTURE_ID;
  const langHeader = hdrs.get("x-sim-lang");
  const lang = isLang(langHeader) ? langHeader : DEFAULT_LANG;
  const sp = await searchParams;
  const fixture = getFixtureById(fixtureId);

  if (!fixture) {
    return <IndexPage lang={lang} searchParams={sp} />;
  }

  switch (fixture.patternType) {
    case "direct":
      return <DirectFixturePage fixtureId={fixtureId} searchParams={sp} lang={lang} />;
    case "email_gated":
      return <EmailGatedPage fixtureId={fixtureId} searchParams={sp} lang={lang} />;
    case "login":
      return <LoginPage fixtureId={fixtureId} searchParams={sp} lang={lang} />;
    case "login_password_only":
      return <LoginPwPage fixtureId={fixtureId} searchParams={sp} lang={lang} />;
    case "email_password":
      return <EmailOtpPage fixtureId={fixtureId} searchParams={sp} lang={lang} />;
    case "email_password_triggered":
      return <EmailOtpTriggerPage fixtureId={fixtureId} searchParams={sp} lang={lang} />;
    default:
      // direct_url / trap hosts are rewritten by proxy.ts before reaching here.
      return <IndexPage lang={lang} searchParams={sp} />;
  }
}
