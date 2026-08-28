# Invoice Platform Example

A hand-written, from-scratch Next.js (App Router + TypeScript) app that impersonates **8
Japanese invoice-delivery platform patterns**, keyed on the HTTP `Host` header. Each host
serves a downloadable NTA-style qualified-invoice PDF behind a different delivery/auth flow.
Built as a fixture suite for testing an invoice-receiving automation (e.g. Playwright-based) —
not a real invoicing product. No database, no real credentials, no outbound network calls at
request-serving time.

## Quick start

```bash
npm install
npm run dev
```

Then either:

- **Browser** (no `/etc/hosts` edits needed — `*.localhost` resolves to `127.0.0.1` in modern
  browsers): `http://inv2-direct.localhost:3000/`
- **Query override** (works everywhere, including plain `localhost`):
  `http://localhost:3000/?__host=inv2-direct`
- **curl** (pass the Host header explicitly):
  `curl -H "Host: inv2-direct" http://localhost:3000/`

Unknown/apex hosts render the fixture index page listing all 8 hosts.

Every response (pages and API routes alike) carries `x-sim-fixture` and `x-sim-pattern-type`
response headers, so you can check which fixture resolved without opening the page:

```bash
curl -sI "http://localhost:3000/?__host=inv2-direct" | grep -i x-sim
```

All pages are served with a global `X-Robots-Tag: noindex, nofollow` header (see
`next.config.ts`).

## Language (English / Japanese)

The UI supports English and Japanese, **English by default**. Every fixture page (and the
index) shows an `EN | 日本語` switcher. Resolution order, handled by `proxy.ts` exactly like
fixture resolution:

1. `?lang=en` or `?lang=ja` query param — always wins, and is persisted into a `sim_lang`
   cookie (1 year) so it stays sticky across navigation without repeating the param.
2. the `sim_lang` cookie, if set from a previous visit.
3. English (`DEFAULT_LANG` in `lib/i18n.ts`).

```bash
curl -s "http://localhost:3000/?__host=inv2-login&lang=ja" | grep 請求書ポータル
curl -s "http://localhost:3000/?__host=inv2-login" | grep "Invoice Portal Login"   # default: English
```

Selectors (`#download-invoice`, `#username`, `#gate-submit`, `#send-code`, etc.) are **the
same ids in both languages** — only the visible label text changes. The generated invoice PDF
itself always stays in Japanese regardless of UI language (it's the fixed NTA-invoice data
artifact, not UI chrome) — see the PDF recipe section below.

## Host table

| Host id | `pattern_type` | Flow |
|---|---|---|
| `inv2-direct` | `direct` | `/` and `/d/<token>` show an invoice preview box (発行元/請求書番号/金額/ダウンロード期限) + `<a id="download-invoice">請求書をダウンロード</a>` → `/api/invoice.pdf`. |
| `inv2-direct-url` | `direct_url` | No page at all — **every** path under this host is rewritten (by `proxy.ts`) straight to `/api/direct-url`, which streams the PDF directly with `Content-Disposition: attachment`. |
| `inv2-email-gated` | `email_gated` | `#gate-email` + `#gate-submit` → `POST /api/sim/gate`. Variant A (default) reveals `#download-invoice` inline. Variant B (`?variant=b`) shows 「リンクをメールで送信しました」 plus a clearly-labeled **DRY-RUN** block containing the one-time link (`/d/<token>`); the token embeds an expiry timestamp that `/d/[token]` enforces. |
| `inv2-login` | `login` | `#username` + `#password` + `#login-submit` → `POST /api/sim/login` → httpOnly session cookie → 請求履歴 (3 months) with per-month links `id="download-<YYYYMM>"` → `/api/sim/download?ym=YYYYMM` (session-gated). |
| `inv2-login-pw` | `login_password_only` | `#password` + `#login-submit` only (no username field). Wrong-password counter cookie locks the host after 5 failures. File list after success. |
| `inv2-email-otp` | `email_password` | Verification code is auto-sent (`POST /api/sim/otp/send` fires on mount) — shows 「認証コードをメールで送信しました」 + a DRY-RUN note. `#code` input; the **submit button deliberately has no `id`** (only reachable via `button[type="submit"]` — a trap kept from the original v1 spec). |
| `inv2-email-otp-trigger` | `email_password_triggered` | Landing page has `#send-code` (認証コードを送信) and **must not render any `id="code"` element** until that button is pressed. After pressing: masked recipient email (`s***@example.test`) appears and `#code` is rendered for the first time. Same verify semantics as `inv2-email-otp`. |
| `inv2-about-blank` | `trap` | Every path returns an HTML page that both meta-refreshes and `location.replace`s to `about:blank`. An automation under test must **never** register this host as a platform, even on a "success" path. |

Host matching accepts, in order: the `?__host=inv2-<name>` query override (always wins, for
curl testing without a custom `Host` header), the bare id (`inv2-direct`), or a
subdomain-style host (`inv2-direct.localhost`, `inv2-direct.vercel.app`, `inv2-direct.<any-base>`).

## Deployed hosts (Vercel)

Live as project `hamasmart/invoice-example`. Each pattern has its own subdomain, registered
as a **project domain**, so an automation can detect the platform shape from the hostname:

`inv2-direct.vercel.app` · `inv2-direct-url.vercel.app` · `inv2-email-gated.vercel.app` ·
`inv2-login.vercel.app` · `inv2-login-pw.vercel.app` · `inv2-email-otp.vercel.app` ·
`inv2-email-otp-trigger.vercel.app` · `inv2-about-blank.vercel.app`

All 8 answer anonymously and follow the newest production deployment automatically. The
fixture index lives at `invoice-example-liard.vercel.app` (fixtures also reachable from it
via `?__host=`); raw deployment URLs stay behind Vercel SSO by design. Note
`invoice-example.vercel.app` (no suffix) is an unrelated third-party site.

See **`DEPLOYMENT.md`** for how the domains are wired, how to re-register one, and the
post-deploy verification loop. Do not use `vercel alias set` for these hosts — it pins them
to a single deployment.

Register hosts in the **dev** registry only (fill `example_url` at registration); never
register `inv2-about-blank`, and never fire fixtures at prod.

## Credentials / codes (dummy, hard-coded, never real)

- Username: `sim-user@example.test`
- Password: `sim-password-2026`
- OTP code (fixed, dry-run — no SMTP is ever contacted): `424242`

## Cookie-based state (no DB)

All interactive-flow state lives in httpOnly cookies, scoped per fixture id (the cookie name
embeds the host id, e.g. `sim_login_inv2-login`) so testing multiple hosts against one real
origin via `?__host=` never lets their state collide:

- **Login session** (`inv2-login`): `{ token, createdAt, used }`. With `?relogin=1` on the
  download endpoint, the *first* download succeeds and marks the session `used`; any further
  `relogin=1` download then returns 401 (simulating a session that expired after one use).
- **Login-pw retry counter** (`inv2-login-pw`): a cumulative wrong-password counter; the host
  locks (423, even against the correct password) once it reaches 5. There is no reset endpoint
  — clear cookies to start over.
- **OTP issuance** (`inv2-email-otp`, `inv2-email-otp-trigger`): `{ issuedAt, lastSendAt,
  attempts, locked }`. Expiry is 10 minutes from `issuedAt`; resend cooldown is 60s from
  `lastSendAt`; wrong-code limit is 5 attempts (locks the code, independent of the retry-counter
  design above). A successful resend (after the cooldown) issues a fresh code and resets the
  attempt counter.

## Failure-mode query params (composable)

**PDF endpoints** (`/api/invoice.pdf`, `/api/direct-url`, `/api/sim/download`):

| Param | Effect |
|---|---|
| `?empty=1` | 204 No Content |
| `?http500=1` | 500 Internal Server Error |
| `?htmlfile=1` | 200 `text/html` body, but with a `.pdf`-looking `Content-Disposition` filename |
| `?jsonerr=1` | 200 `application/json` `{"error": "..."}` |
| `?slow=S` (≤120) | delays the response by S seconds |
| `?n=K` / `?ym=YYYYMM` | varies the generated invoice number/content |

**`inv2-direct` page** (`/` and `/d/<token>`):

| Param | Effect |
|---|---|
| `?popup=1` / `?popup=2` | obstructing overlay over the download button — see below for the two cases |
| `?obstruct=` | composable UI-obstruction fixtures (cookie banners, toasts, native dialogs, stray windows, etc.) — see below |
| `?selector=v2` | the download element becomes `<a class="dl-link-v2">` with **no** `id` |
| `?multi=N` (≤10) | N buttons, `id="download-invoice-1"` .. `"download-invoice-N"`, each a distinct invoice number |
| `?slow=S` (≤120) | the download button renders only after S seconds |
| `?expired=1` | shows a 期限切れ (expired) message instead — no button at all |

**Auth hosts** (`inv2-email-gated`, `inv2-login`, `inv2-login-pw`, `inv2-email-otp`,
`inv2-email-otp-trigger`):

| Param | Effect |
|---|---|
| `?wrongpin=1` | the valid credential/code is still refused (401) |
| `?expired=1` | the code/token/link is treated as already expired |
| `?relogin=1` | `inv2-login` only — first download OK, second bounces to 401 (session marked used) |
| `?popup=1` / `?popup=2` | obstructing modal over the credential form — see below for the two cases |
| `?obstruct=` | composable UI-obstruction fixtures — see below |

### The `?popup=` obstructing-modal fixture

`?popup=` is supported on **every** interactive host — `inv2-direct` **and** all five
credential hosts (`inv2-email-gated`, `inv2-login`, `inv2-login-pw`, `inv2-email-otp`,
`inv2-email-otp-trigger`) — via a shared component (`app/_fixtures/PopupOverlay.tsx`) with
stable selectors: `#popup-overlay` (the covering element) and `#popup-close` (its close
button). It exists specifically to test whether an invoice-receiving automation correctly
detects and handles an obstructing dialog (cookie-consent banner, "verify you're human"
notice, ad, session warning, etc.) rather than stalling or clicking through to nothing.

**Three cases, all available on every one of those six hosts:**

| `?popup=` | Case | Behavior |
|---|---|---|
| *(absent)* | baseline | no overlay at all — the form/button is usable immediately |
| `1` | dismissible | clicking `#popup-close` hides the overlay and unblocks the form underneath (username/password/email/code fields, submit buttons, or the direct-host download link). **Positive test**: the automation must detect it, close it, then proceed normally. |
| `2` (or `trap`) | permanent trap | the overlay never goes away, even after clicking `#popup-close` — modeled on malvertising popups that keep coming back. **Negative test**: the underlying action must still fail/never complete. |

In every case the overlay is a real full-coverage element (`position: absolute; inset: 0;
z-index: 50`) over the card, so it genuinely intercepts clicks on the underlying form until
handled — it isn't just decorative. `resolvePopupMode()` in `PopupOverlay.tsx` is the single
place this three-way switch is implemented; every fixture page calls it the same way.

### The `?obstruct=` composable obstruction fixtures

`?obstruct=` is supported on the same six interactive hosts as `?popup=` — `inv2-direct` and
all five credential hosts — via `app/_fixtures/Obstructions.tsx`. It is independent of, and
composes freely with, `?popup=`, `?lang=`, and every failure-mode param above. It exists to
simulate the realistic UI obstacles (modals, native dialogs, toasts, banners, invisible
overlays, stray windows) that trip up web RPA in the wild, beyond the single obstructing-modal
shape `?popup=` covers.

Value: a comma-separated list of obstruction types, each with an optional `:N` numeric
argument, e.g. `?obstruct=cookie-banner,chat-widget,toast` or `?obstruct=spinner:5,delayed-modal:10`.
**Unknown types are ignored silently** (so the param stays safe to extend/typo against). With no
`?obstruct=` param at all, no `#obstruct-*` element is ever rendered and no native-dialog/window
handler is ever registered — this is the default, unobstructed baseline.

Selector convention (exact, automation-facing): container `id="obstruct-<type>"`, dismiss
control `id="obstruct-<type>-close"` (`-accept` for the cookie banner).

| Type | What it does | Selectors | Dismissible | `:N` arg |
|---|---|---|---|---|
| `cookie-banner` | Fixed bar across the bottom of the viewport, high z-index, genuinely covers the primary action (the most common real-world blocker) | `#obstruct-cookie-banner`, accept: `#obstruct-cookie-accept` | Yes | — |
| `toast` | Notification in the top-right corner | `#obstruct-toast` | Auto-hides after 5s (no close button — a timing race, not a permanent block) | — |
| `toast-sticky` | Same visual as `toast`, but positioned over the primary action and never auto-hides | `#obstruct-toast-sticky`, close: `#obstruct-toast-sticky-close` | Yes | — |
| `chat-widget` | Fixed circular bubble in the bottom-right corner | `#obstruct-chat-widget`, close: `#obstruct-chat-widget-close` | Yes | — |
| `invisible-overlay` | Fully transparent (`opacity:0`/`background:transparent`) div with a real hit area over the primary action; the button stays visible and enabled, but clicks land on the overlay and do nothing ("element not clickable at point" / silently-swallowed-click case) | `#obstruct-invisible-overlay` | No | — |
| `sticky-header` | Tall (~140px) fixed header at the top; a `scrollIntoView` on the target leaves it hidden underneath | `#obstruct-sticky-header` | No | — |
| `spinner` | Loading overlay covering the card. Bare `spinner` never resolves; `spinner:N` resolves after N seconds | `#obstruct-spinner` | No (self-resolves only with `:N`) | resolve-after-seconds |
| `delayed-modal` | A modal appears N seconds **after** load (default 3) — i.e. after an RPA has already located the button | `#obstruct-delayed-modal`, close: `#obstruct-delayed-modal-close` | Yes | delay-seconds (default 3) |
| `scroll-lock` | Sets `document.body.style.overflow = "hidden"` and inserts a tall spacer so the primary action sits below the fold and cannot be scrolled to (cleans up on unmount) | `#obstruct-scroll-lock` | No | — |
| `alert` | Calls `window.alert(...)` once on mount | — (native dialog) | N/A | — |
| `confirm` | Clicking the primary action calls `window.confirm(...)` first; cancelling it cancels the action (`preventDefault`, nothing proceeds) | — (native dialog) | N/A | — |
| `prompt` | Calls `window.prompt(...)` once on mount | — (native dialog) | N/A | — |
| `beforeunload` | Registers a `beforeunload` handler so leaving/downloading triggers the browser's "Leave site?" dialog (cleans up on unmount) | — (native dialog) | N/A | — |
| `new-window` | Clicking the primary action calls `window.open()` on a decoy URL first (focus steal / extra page/context), then lets the original action proceed | — (no DOM footprint) | N/A | — |

Any number of types can be combined in one `?obstruct=` value, and click-time gating
(`confirm`, `new-window`) stacks with mount-effect types (`alert`, `prompt`) and DOM types in the
same request — e.g. `?obstruct=cookie-banner,confirm,beforeunload` shows the banner, gates the
primary action behind a confirm dialog, and arms the leave-site warning, all at once.
`parseObstructions()` / `<Obstructions>` / `useObstructionGate()` in `Obstructions.tsx` are the
three pieces every fixture page wires in, alongside (never replacing) `PopupOverlay`.

## PDF recipe

Every generated PDF is an A4 page built with `pdf-lib`, with all Japanese text rendered via an
embedded (subset) copy of **M PLUS 1p Regular** (SIL OFL 1.1, vendored at
`assets/fonts/MPLUS1p-Regular.ttf` from the `google/fonts` repository — pdf-lib's built-in
standard fonts cannot render Japanese glyphs at all). Text is drawn as real, selectable text —
not rasterized — so the PDF stays `pdftotext`/`pdfplumber`-extractable.

Fields included, per the NTA qualified-invoice ("適格請求書") requirements (no fixed layout is
mandated by law, only required content):

- 発行者名 (株式会社サンプル) + 登録番号 (`T1234567890123`)
- 宛名 ("Invoice System Test Org 御中")
- 請求書番号 (`INV2-<YYYYMM>-NNNNN`, varied by `?n=`/`?ym=`)
- 取引年月日 / 請求期間
- 2+ line items with 数量 / 単価 / 金額, split across 10% and 8% (軽減税率) tax-rate groups
- 税率別合計 + 税率ごとの消費税額
- 合計金額 (税込)
- 支払期限
- 振込先 (架空銀行 — a fictional bank)

Filename: `請求書_<YYYYMM>_株式会社サンプル.pdf`, sent via a dual `Content-Disposition`
(`filename=` ASCII fallback + RFC 5987 `filename*=UTF-8''...`), always `attachment`.

## Architecture notes

- `proxy.ts` is Next 16's current file convention (the renamed `middleware.ts` — same
  `NextRequest`/`NextResponse` API). It resolves the fixture id from the `Host` header (or
  `?__host=`), stamps `x-sim-fixture` / `x-sim-pattern-type` on both the request (so pages/route
  handlers can read them) and the response (so every response carries them), and rewrites every
  path under `inv2-direct-url` / `inv2-about-blank` to their single backing API route.
- No DB anywhere — all "server-side" state is either a deterministic pure function
  (`lib/pdf.ts`) or an httpOnly cookie (`lib/simState.ts`).
- Client fixture pages (`app/_fixtures/*.tsx`, all `"use client"`) drive their own flow via
  `fetch()` to the `app/api/sim/**` routes; the browser sends cookies automatically for
  same-origin requests, so no explicit `credentials` option is needed.
- `app/_fixtures/Obstructions.tsx` is the shared `?obstruct=` obstruction-fixture system
  (`parseObstructions()` / `<Obstructions>` / `useObstructionGate()`), wired into the same six
  interactive hosts as `PopupOverlay`, independently of it.
- `next-env.d.ts`, and any `AGENTS.md`/`CLAUDE.md` stub Next.js auto-generates on first
  `npm run dev`, are left as-is.

## Synthetic-fixture caveat

Per the source spec's research limits (§A.6): `email_gated`'s page shape, and every
token/expiry/retry-counter semantic in this app, are **synthetic** — no public specification of
a real vendor's exact flow was available. They're realistic-shaped but invented; a
consumer/automation passing against these fixtures is not thereby proven correct against any
specific real vendor's actual behavior.

## Out of scope

- The email-fixture case catalog and `/api/send-email-fixture` endpoint (dry-run SMTP case
  bank) — not built; this app only covers the 8 page/download fixtures.
- Deployment and dev-registry registration — human-gated, not performed by this build.
- Git operations of any kind — this repository is not initialized as a git repo by this build;
  version control is left entirely to the human owner.

## Verification

```bash
npm install && npx tsc --noEmit   # must be clean
npm run dev                       # note the actual port
```

```bash
# Headers
curl -sI "http://localhost:3000/?__host=inv2-direct" | grep -i x-sim

# invoice.pdf
curl -s "http://localhost:3000/api/invoice.pdf?__host=inv2-direct" | head -c 5   # %PDF-
curl -sI "http://localhost:3000/api/invoice.pdf?empty=1&__host=inv2-direct"      # 204

# direct-url (no page, every path serves the PDF)
curl -sI "http://localhost:3000/anything?__host=inv2-direct-url"                 # attachment + %PDF-

# about:blank trap
curl -s "http://localhost:3000/?__host=inv2-about-blank" | grep "about:blank"

# login flow
curl -si -c /tmp/c.txt -X POST "http://localhost:3000/api/sim/login?__host=inv2-login" \
  -H "Content-Type: application/json" -d '{"username":"sim-user@example.test","password":"sim-password-2026"}'
curl -sI -b /tmp/c.txt "http://localhost:3000/api/sim/download?ym=202608&__host=inv2-login"
```

Then kill the dev server and `rm -rf .next tsconfig.tsbuildinfo`.
