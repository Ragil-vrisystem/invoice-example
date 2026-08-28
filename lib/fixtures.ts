/**
 * Typed registry of the 8 fixture hosts + fixture-id resolution.
 *
 * Host header shapes recognized:
 *   inv2-<name>                (bare id, e.g. via `curl -H "Host: inv2-direct"`)
 *   inv2-<name>.localhost      (browser-friendly local dev)
 *   inv2-<name>.vercel.app     (deployed shape, for parity — this app is never deployed by an agent)
 *   ?__host=inv2-<name>        (query override, always wins, for curl testing without custom Host headers)
 *
 * Unknown/apex hosts resolve to the "index" pseudo-fixture (fixture listing page).
 */

import type { Lang } from "./i18n";

export type PatternType =
  | "direct"
  | "direct_url"
  | "email_gated"
  | "login"
  | "login_password_only"
  | "email_password"
  | "email_password_triggered"
  | "trap"
  | "index";

type Bilingual = Record<Lang, string>;

export interface FixtureDef {
  id: string;
  patternType: PatternType;
  label: Bilingual;
  description: Bilingual;
  /**
   * Human-readable "what to enter" hint for this fixture, shown on the index
   * page next to its link. Every credential/code here is dummy, fictional
   * test data (see README) — safe to display in the clear, since none of it
   * is a real secret.
   */
  credentialsHint: Bilingual;
}

export const FIXTURES: readonly FixtureDef[] = [
  {
    id: "inv2-direct",
    patternType: "direct",
    label: {
      en: "Direct download (tokenized URL)",
      ja: "直接ダウンロード（トークン付きURL）",
    },
    description: {
      en: "Opening the invited URL (/d/<token>) shows an invoice preview and a download button. Bill One shape.",
      ja: "招待されたURL(/d/<token>)を開くと請求書プレビューとダウンロードボタンが表示される。Bill One 型。",
    },
    credentialsHint: {
      en: "No auth required — opening the page shows the #download-invoice button immediately.",
      ja: "認証不要 — ページを開くとそのまま #download-invoice ボタンが表示されます。",
    },
  },
  {
    id: "inv2-direct-url",
    patternType: "direct_url",
    label: {
      en: "Signed-URL direct delivery",
      ja: "署名付きURL直接配信",
    },
    description: {
      en: "The URL itself is the download. No page, no selector. AWS signed-S3-URL shape.",
      ja: "URL自体がダウンロードそのもの。ページ・セレクタなし。AWS署名付きS3 URL型。",
    },
    credentialsHint: {
      en: "No auth required — visiting the URL itself is the download (any path works).",
      ja: "認証不要 — URLへのアクセス自体がダウンロードです（任意のパスでOK）。",
    },
  },
  {
    id: "inv2-email-gated",
    patternType: "email_gated",
    label: {
      en: "Email-address gate",
      ja: "メールアドレス入力ゲート",
    },
    description: {
      en: "Entering an email address reveals the invoice, or a one-time link is sent. (Synthetic fixture.)",
      ja: "メールアドレスを入力すると請求書が表示される、またはワンタイムリンクが送付される。（合成フィクスチャ）",
    },
    credentialsHint: {
      en: "Any email address works (e.g. you@example.test). Use variant=b to see the one-time link (DRY-RUN).",
      ja: "任意のメールアドレスでOK（例: you@example.test）。variant=b でワンタイムリンク（DRY-RUN）を表示。",
    },
  },
  {
    id: "inv2-login",
    patternType: "login",
    label: {
      en: "Login (username + password)",
      ja: "ログイン型（ID・パスワード）",
    },
    description: {
      en: "Log in with a username and password, then pick a month from the invoice history to download.",
      ja: "ユーザー名とパスワードでログインし、請求履歴（複数月）から選択してダウンロード。",
    },
    credentialsHint: {
      en: "Username: sim-user@example.test / Password: sim-password-2026",
      ja: "ユーザー名: sim-user@example.test / パスワード: sim-password-2026",
    },
  },
  {
    id: "inv2-login-pw",
    patternType: "login_password_only",
    label: {
      en: "Password-only login",
      ja: "パスワードのみログイン",
    },
    description: {
      en: "Password-only authentication. Locks after 5 failures. HENNGE shape.",
      ja: "パスワードのみで認証。5回失敗でロック。HENNGE型。",
    },
    credentialsHint: {
      en: "Password: sim-password-2026 (no username field)",
      ja: "パスワード: sim-password-2026（ユーザー名入力欄なし）",
    },
  },
  {
    id: "inv2-email-otp",
    patternType: "email_password",
    label: {
      en: "Email verification code (auto-sent)",
      ja: "メール認証コード（自動送信）",
    },
    description: {
      en: "The verification code is emailed automatically on page open (dry-run). The submit button has no id.",
      ja: "ページを開くと自動的に認証コードがメール送信される（ドライラン）。送信ボタンにIDなし。",
    },
    credentialsHint: {
      en: "Verification code: 424242 (auto-sent on open, shown on-screen via DRY-RUN)",
      ja: "認証コード: 424242（開くと自動送信・DRY-RUNで画面に表示されます）",
    },
  },
  {
    id: "inv2-email-otp-trigger",
    patternType: "email_password_triggered",
    label: {
      en: "Email verification code (trigger-to-send)",
      ja: "メール認証コード（送信トリガー式）",
    },
    description: {
      en: "The code input field does not exist until the \"Send verification code\" button is pressed.",
      ja: "「認証コードを送信」ボタンを押すまでコード入力欄は存在しない。",
    },
    credentialsHint: {
      en: "Press \"Send verification code\", then enter verification code: 424242.",
      ja: "「認証コードを送信」を押してから 認証コード: 424242 を入力してください。",
    },
  },
  {
    id: "inv2-about-blank",
    patternType: "trap",
    label: {
      en: "about:blank trap",
      ja: "about:blank トラップ",
    },
    description: {
      en: "Always redirects to about:blank. A trap fixture that must never be registered as a platform.",
      ja: "常に about:blank にリダイレクトする。プラットフォームとして絶対に登録されてはならない罠フィクスチャ。",
    },
    credentialsHint: {
      en: "No auth required — opening it redirects to about:blank immediately (a trap that must not be registered).",
      ja: "認証不要 — 開くと即座に about:blank へ転送されます（登録してはいけない罠）。",
    },
  },
] as const;

const FIXTURE_BY_ID = new Map<string, FixtureDef>(FIXTURES.map((f) => [f.id, f]));

export function getFixtureById(id: string): FixtureDef | undefined {
  return FIXTURE_BY_ID.get(id);
}

export const INDEX_FIXTURE_ID = "index";

/**
 * Resolve the fixture id from a Host header value and an optional __host query override.
 * Returns INDEX_FIXTURE_ID when nothing recognized matches (apex / unknown host).
 */
export function resolveFixtureId(hostHeader: string | null, hostOverride: string | null): string {
  if (hostOverride && FIXTURE_BY_ID.has(hostOverride)) {
    return hostOverride;
  }

  if (!hostHeader) {
    return INDEX_FIXTURE_ID;
  }

  // Strip port, e.g. "inv2-direct.localhost:3000" -> "inv2-direct.localhost"
  const hostNoPort = hostHeader.split(":")[0];

  // Bare id match: "inv2-direct"
  if (FIXTURE_BY_ID.has(hostNoPort)) {
    return hostNoPort;
  }

  // Subdomain-style match: "inv2-direct.localhost" / "inv2-direct.vercel.app" / "inv2-direct.<base>"
  const firstLabel = hostNoPort.split(".")[0];
  if (firstLabel.startsWith("inv2-") && FIXTURE_BY_ID.has(firstLabel)) {
    return firstLabel;
  }

  return INDEX_FIXTURE_ID;
}
