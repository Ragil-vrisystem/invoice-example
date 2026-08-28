# Invoice Platform Example — Detailed Test-Case Catalog

> Every fixture case this simulator provides, with the exact URL/steps, the **verified simulator
> behavior** (what the fixture actually does — all rows below were verified by curl against the
> running app), and the **expected automation outcome** in the invoice-system ledger vocabulary
> (`invoice_inbound_item.outcome`: `stored`/`auto_stored`, `not_recognized`, `failed`,
> `unopened_archive`) plus the platform-registry assertion (row created / not created,
> `pattern_type` value, selector cached).
>
> Spec source: `plans/invoice-platforms/simulator-spec-requirements-detailed.md` (outer repo),
> Part A. Case IDs are stable — reference them in QA runs and tickets.

## 1. Environments

| Environment | Base | Notes |
|---|---|---|
| **Production (Vercel)** | `https://inv2-<name>.vercel.app` | One alias per host (detection by domain). Requires the project's *Deployment Protection → Vercel Authentication* to be **Disabled**; until then these redirect to Vercel SSO. Public project domain: `invoice-example-liard.vercel.app` (index; fixtures reachable via `?__host=`). `invoice-example.vercel.app` (no suffix) is an **unrelated third-party site** — never use it. |
| **Local** | `http://localhost:3000` | `npm run dev`. Use `?__host=inv2-<name>` (always wins) or browser-friendly `http://inv2-<name>.localhost:3000/`. |

Every response on every host/path carries `x-sim-fixture` + `x-sim-pattern-type` (and
`x-sim-lang`) headers — verify what the middleware resolved without opening the page:
`curl -sI <url> | grep x-sim`. All pages are `noindex, nofollow`.

**Registry rule (from the spec):** register hosts in the **dev** registry only, fill
`example_url` at registration, never register `inv2-about-blank`, never fire fixtures at prod.

## 2. Constants (dummy, hard-coded, never real)

| What | Value |
|---|---|
| Login username | `sim-user@example.test` |
| Password (login + login-pw) | `sim-password-2026` |
| OTP code (fixed, dry-run — no real mail) | `424242` |
| PDF issuer / 登録番号 | 株式会社サンプル / `T1234567890123` |
| PDF recipient | Invoice System Test Org |
| Invoice number scheme | `INV2-<YYYYMM>-0000N` (`N` from `?n=`, default 1) |
| PDF filename | `請求書_<YYYYMM>_株式会社サンプル.pdf` (RFC 5987, `Content-Disposition: attachment`) |

State (sessions, attempt counters, OTP issuance) lives in httpOnly cookies scoped per host id —
**a fresh browser context / cleared cookie jar fully resets every case** (lockouts included).

## 3. Cross-host query params

These compose with everything below.

| Param | Values | Behavior (verified) |
|---|---|---|
| `?lang=` | `en` (default) / `ja` | Switches all UI text; sticky via `sim_lang` cookie; `x-sim-lang` header; **all selector ids identical in both languages**; the PDF content is always Japanese. |
| `?popup=` | *(absent)* / `1` / `2` or `trap` | Absent = no overlay. `1` = **dismissible** modal: `#popup-overlay` blocks the form/button, clicking `#popup-close` hides it and unblocks (positive case — automation must detect, close, proceed). `2`/`trap` = **permanent trap**: `#popup-close` never removes the overlay (negative case — run must fail, not stall). Applies to `inv2-direct` and all 5 auth hosts. ⚠️ Deviation from the v1/reference numbering, where `popup=1` was the blocking case. |
| `?slow=S` | 0–120 (clamped) | PDF endpoints: response delayed S seconds. `inv2-direct` page: download element renders only after S seconds (client-side). |

## 4. PDF endpoint failure params

Apply to **all** PDF-serving endpoints: `/api/invoice.pdf`, every path on `inv2-direct-url`,
and the session-gated `/api/sim/download`.

| Case | Param | Simulator behavior (verified) | Expected automation outcome |
|---|---|---|---|
| PDF-OK | *(none)* | 200 `application/pdf`, body starts `%PDF-`, text-extractable Japanese (pdftotext round-trip confirmed: 発行者, 登録番号, 税率別合計, 支払期限, 振込先) | artifact valid → `stored` |
| PDF-N | `?n=2` | Different invoice number (`…-00002`) → byte-different PDF | distinct invoice filed per `n` |
| PDF-EMPTY | `?empty=1` | **204 No Content**, no body | run `failed`, no file screenshot/artifact, platform never `completed` |
| PDF-500 | `?http500=1` | **500** JSON `{"error":"internal_server_error"}` | clean `failed` |
| PDF-HTML | `?htmlfile=1` | **200 `text/html`** with a `.pdf` filename in `Content-Disposition` (deliberate trap) | artifact-validation verdict `html_page` → `failed` (once `ARTIFACT_VALIDATION_MODE=enforce`) |
| PDF-JSON | `?jsonerr=1` | **200 `application/json`** `{"error":"download_failed","reason":"simulated_json_error"}` | verdict `json_error` → `failed` |
| PDF-SLOW | `?slow=30` | 200 PDF after 30 s | `stored` if automation timeout > S |

## 5. Host-by-host cases

### 5.1 `inv2-direct` — `pattern_type: direct` (Bill One-shaped)

Page at `/` and `/d/<token>` (token cosmetic): invoice preview (発行元 / 請求書番号 / 金額 /
ダウンロード期限) + download element → `/api/invoice.pdf`.

| Case | URL / steps | Simulator behavior (verified) | Expected outcome / registry assertion |
|---|---|---|---|
| DIRECT-01 happy | `/` | `<a id="download-invoice">` present; click downloads PDF | `stored`; registry row for the host, `pattern_type=direct`, `status=completed`, selector `#download-invoice` cached |
| DIRECT-02 tokenized | `/d/anytoken123` | Same page/selector as `/` | same as DIRECT-01 |
| DIRECT-03 selector change | `/?selector=v2` | Element becomes `<a class="dl-link-v2">`, **no** `id="download-invoice"` anywhere | re-detection succeeds → `stored`; cached selector **updated** (re-detection, not pinning) |
| DIRECT-04 multi | `/?multi=3` (N ≤ 10) | `#download-invoice-1`, `-2`, `-3`; distinct invoice numbers (`?n=i` each) | **all N** invoices filed with distinct numbers |
| DIRECT-05 slow render | `/?slow=10` | "preparing" placeholder; element appears after 10 s | `stored` (automation must wait) |
| DIRECT-06 expired token | `/?expired=1` | Expired notice, **no download element at all** | `failed` — no false click, no artifact |
| DIRECT-07 popup positive | `/?popup=1` | `#popup-overlay` blocks the button; `#popup-close` removes it | automation closes popup → `stored` |
| DIRECT-08 popup trap (T3.2) | `/?popup=2` (or `popup=trap`) | Overlay never goes away; close button does nothing | `failed`, **not** `stored` — must survive any popup-auto-close feature |
| DIRECT-09..13 | `/?empty=1`, `?http500=1`, `?htmlfile=1`, `?jsonerr=1` (forwarded to the PDF link) | See §4 | see §4 |

### 5.2 `inv2-direct-url` — `pattern_type: direct_url` (signed-S3-URL-shaped, SELECTORLESS)

**No page, no selector — the URL itself is the download.** Every path on the host is rewritten
to the PDF endpoint. Cosmetic header `x-sim-cosmetic-signature: AWS4-HMAC-SHA256-SIMULATED`.

| Case | URL | Simulator behavior (verified) | Expected outcome / registry assertion |
|---|---|---|---|
| DURL-01 happy | any path, e.g. `/x/y/z?sig=abc` | 200 PDF, `Content-Disposition: attachment` | `stored`; registry row `pattern_type=direct_url`, **EMPTY selector is CORRECT** — usability checks must exempt it (INV-55); the runner must short-circuit before element lookup |
| DURL-02..06 | `?empty=1` / `?http500=1` / `?htmlfile=1` / `?jsonerr=1` / `?slow=S` | See §4 (all honored on any path) | see §4 — this host is the re-cache exemption regression fixture |

### 5.3 `inv2-email-gated` — `pattern_type: email_gated` (synthetic, Hajimari-shaped)

`#gate-email` input + `#gate-submit` → `POST /api/sim/gate` (JSON `{email}`). Any well-formed
email is accepted.

| Case | URL / steps | Simulator behavior (verified) | Expected outcome / registry assertion |
|---|---|---|---|
| GATE-01 variant A happy | `/` → enter any email → submit | API 200 `{ok:true,variant:"a"}`; page reveals `#download-invoice` | `stored`; registry row `pattern_type=email_gated` with gate selectors (`#gate-email`, `#gate-submit`) |
| GATE-02 variant B (magic link) | `/?variant=b` → submit email | API 200 with `dryRun:true` and a one-time link `/d/<token>` (expires in 15 min); page shows it as `#magic-link` in a labeled **DRY-RUN** block (no real mail is sent) | automation follows the link → `/d/<token>` reveals the download → `stored`. ⚠️ Single-use is **not** enforced (no DB) — only expiry is |
| GATE-03 expired link | `/?variant=b&expired=1` → submit → open the returned `/d/<token>` | Token embeds an already-past `expiresAt`; `/d/<token>` shows an expired message, no download | `failed` |
| GATE-04 refusal | `/?wrongpin=1` → submit valid email | API **401** `{error:"refused"}` | `failed` — valid input still refused |
| GATE-05 invalid email | submit empty / no `@` | API **400** `{error:"invalid_email"}` | `failed` |
| GATE-06 popup | `/?popup=1` or `?popup=2` | Overlay blocks `#gate-email`/`#gate-submit` (see §3) | popup=1 → proceed after close; popup=2 → `failed` |

### 5.4 `inv2-login` — `pattern_type: login` (corporate-portal-shaped)

`#username` + `#password` + `#login-submit` → `POST /api/sim/login` → httpOnly session cookie
(`sim_login_inv2-login`) → invoice history: the **3 most recent months** (current first), each
row `id="download-<YYYYMM>"` → `/api/sim/download?ym=<YYYYMM>` (session-gated).

| Case | URL / steps | Simulator behavior (verified) | Expected outcome / registry assertion |
|---|---|---|---|
| LOGIN-01 happy | login with the §2 credentials → click a month | login 200 + `Set-Cookie`; download 200 `%PDF-` per month | `stored` per month; registry row `pattern_type=login` with login pre-step selectors |
| LOGIN-02 wrong creds | wrong username or password | **401** `{error:"invalid_credentials"}`; no cookie | `failed` |
| LOGIN-03 unauthenticated download | `GET /api/sim/download?ym=<YYYYMM>` without cookie | **401** `{error:"unauthenticated"}` | `failed` — download is genuinely gated |
| LOGIN-04 expired session (relogin) | `/?relogin=1`: login → download → download again | 1st download **200** `%PDF-` (session then marked used); 2nd download **401** even though the cookie still exists | 1st `stored`; on the 2nd the automation must **re-login** (or the run is `failed`) — expired-session handling fixture |
| LOGIN-05 refusal | `/?wrongpin=1` + correct credentials | **401** `{error:"refused"}` | `failed` — valid credential still refused |
| LOGIN-06 popup | `?popup=1` / `?popup=2` | Overlay blocks the login form | see §3 |
| LOGIN-07 PDF failure params | append `?empty=1` etc. to the month link | §4 behaviors on `/api/sim/download` | see §4 |

### 5.5 `inv2-login-pw` — `pattern_type: login_password_only` (HENNGE-shaped)

`#password` + `#login-submit` only (**no username field**). Attempt counter in a 24 h cookie.

| Case | URL / steps | Simulator behavior (verified) | Expected outcome / registry assertion |
|---|---|---|---|
| LPW-01 happy | correct password | 200 + session cookie → month list `id="download-<YYYYMM>"` → gated PDF | `stored`; registry row `pattern_type=login_password_only` |
| LPW-02 wrong password | wrong password ×1..5 | **401** `{error:"invalid_password"}` each time | `failed` per attempt |
| LPW-03 lockout | 5 wrong attempts, then the **correct** password | **423** `{error:"locked"}` — correct password refused too | `failed`; lock persists until cookies cleared (fresh context resets) |
| LPW-04 refusal | `/?wrongpin=1` + correct password | **401** `{error:"refused"}` | `failed` |
| LPW-05 popup | `?popup=1` / `?popup=2` | Overlay blocks the form | see §3 |

### 5.6 `inv2-email-otp` — `pattern_type: email_password` (HENNGE Secure Transfer-shaped, auto-send)

Opening the page **auto-fires** `POST /api/sim/otp/send` (dry-run "mail"): response
`{ok:true, maskedEmail:"s*******@example.test", dryRun:true}`; the page shows the DRY-RUN
notice with the fixed code. `#code` input; **the submit button deliberately has NO id**
(reachable only as `button[type="submit"]` — kept v1 trap); `#resend-code` button.
Verify → `POST /api/sim/otp/verify` (JSON `{code}`) → on success an OTP session cookie gates
`#download-invoice` → `/api/sim/download`.

| Case | URL / steps | Simulator behavior (verified) | Expected outcome / registry assertion |
|---|---|---|---|
| OTP-01 happy | open → enter `424242` → submit → download | verify 200 → download 200 `%PDF-` | `stored`; registry row `pattern_type=email_password`; selector config must survive the id-less submit button |
| OTP-02 wrong code | wrong code ×1–4 | **401** `{error:"wrong_code", attemptsRemaining:N}` | `failed` per attempt |
| OTP-03 lockout | 5th wrong code, then the correct code | 5th → **423** `{error:"locked"}`; correct code afterwards → **423** too | `failed`; a successful **re-send resets** attempts (fresh code = fresh attempts) |
| OTP-04 resend cooldown | `POST /api/sim/otp/send` again within 60 s | **429** `{error:"cooldown", retryAfterMs:…}` | automation must respect cooldown |
| OTP-05 expired | `/?expired=1` → verify correct code | **410** `{error:"expired"}` (also enforced for real after 10 min) | `failed` |
| OTP-06 refusal | `/?wrongpin=1` → verify correct code | **401** `{error:"refused"}` (does **not** consume attempts) | `failed` — valid code still refused |
| OTP-07 not issued | verify without any prior send | **400** `{error:"not_issued"}` | `failed` |
| OTP-08 popup | `?popup=1` / `?popup=2` | Overlay blocks the code form | see §3 |

### 5.7 `inv2-email-otp-trigger` — `pattern_type: email_password_triggered` (HENNGE tenant variant)

Same OTP semantics as §5.6 with one critical difference:

| Case | URL / steps | Simulator behavior (verified) | Expected outcome / registry assertion |
|---|---|---|---|
| OTPT-01 landing contract | `GET /` (raw SSR HTML, before any JS) | Contains `id="send-code"` (認証コードを送信 / "Send code"); contains **NO `id="code"` element** — verified in both languages and under both popup modes | a selector check against the landing page **correctly misses** `#code` — this is expected behavior, **not** a misconfiguration; registry row `pattern_type=email_password_triggered` with trigger-button config |
| OTPT-02 trigger → happy | click `#send-code` → masked email shown → `#code` appears → `424242` → download | send 200, verify 200, download `%PDF-` | `stored` |
| OTPT-03..07 | same failure params as OTP-02..08 | identical semantics (shared endpoints) | identical |

### 5.8 `inv2-about-blank` — TRAP (v1 regression 13a)

| Case | URL | Simulator behavior (verified) | Expected outcome / registry assertion |
|---|---|---|---|
| TRAP-01 | **any** path | 200 HTML that both `<meta http-equiv="refresh">`-redirects and `location.replace()`s to `about:blank` | **NO platform row may ever be created** for this host — not even on a "success" path; any run against it is junk-domain-guard territory |

## 6. Quick verification commands

```bash
B="https://inv2-direct.vercel.app"            # or: B="http://localhost:3000" + "&__host=inv2-<name>"

curl -sI "$B/" | grep -i x-sim                                  # detection headers
curl -s  "$B/api/invoice.pdf" | head -c 5                       # %PDF-
curl -sI "$B/api/invoice.pdf?empty=1"                           # 204
curl -s  "https://inv2-direct-url.vercel.app/x/y" | head -c 5   # %PDF- on any path
curl -s  "https://inv2-about-blank.vercel.app/" | grep -c about:blank

# Login flow
curl -s -c /tmp/cj -X POST -H "Content-Type: application/json" \
  -d '{"username":"sim-user@example.test","password":"sim-password-2026"}' \
  "https://inv2-login.vercel.app/api/sim/login"
curl -s -b /tmp/cj "https://inv2-login.vercel.app/api/sim/download?ym=$(date +%Y%m)" | head -c 5

# OTP flow
curl -s -c /tmp/otp -X POST "https://inv2-email-otp.vercel.app/api/sim/otp/send"
curl -s -b /tmp/otp -c /tmp/otp -X POST -H "Content-Type: application/json" \
  -d '{"code":"424242"}' "https://inv2-email-otp.vercel.app/api/sim/otp/verify"
```

## 7. Caveats & known deviations

1. **Synthetic fixtures** (flag per spec A.6): the `email_gated` page shape and all
   token/expiry/retry semantics have no public real-world specification — a pass here does not
   prove coverage against a real vendor's variant.
2. **`?popup=` numbering deviates from v1/reference**: `1` is now the dismissible positive case;
   the blocking T3.2 trap is `2`/`trap`. Update any E2E table imported from v1 accordingly.
3. **Gate variant-B links are expiring but not single-use** (no DB).
4. **OTP mail is dry-run only** — fixed code `424242`, shown on-page; no SMTP integration.
5. **UI defaults to English** (`?lang=ja` for Japanese). Selector **ids** are
   language-independent, but any `text_selector`-cascade or AI text-based detection sees
   English by default — run with `?lang=ja` (or pre-set the `sim_lang` cookie) when fidelity
   to Japanese production platforms matters.
6. **Lockouts/cooldowns are cookie-scoped** — run each case in a fresh browser context, or
   earlier cases (LPW-03, OTP-03) will contaminate later ones.
7. Vercel aliases point at a specific deployment — after a new `vercel deploy --prod`,
   re-point all 8 (`vercel alias set <new-url> inv2-<name>.vercel.app`, loop in README §Deployed hosts).
