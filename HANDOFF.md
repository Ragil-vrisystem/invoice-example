# HANDOFF — Invoice Example (Simulator) + Platform Databank

> Written 2026-08-28 for moving work to another PC. Everything you need is listed here with
> its location on THIS machine and how to carry it over.

## 1. This project — `invoice-example` (the new invoice simulator)

**Location:** `/Users/necro/DEV/OPSGUIDE/invoice-example`
**⚠️ NOT a git repository** — nothing is version-controlled or on any remote. To move it:
copy the folder **excluding `node_modules/`** (then `npm install` on the new PC), or
`git init` + push to a private remote first. The only other copy of this code is the
Vercel deployment itself.

**Deployed:** Vercel team `hamasmart` (account `ragil-6291`), project **`invoice-example`**,
production `https://invoice-example-liard.vercel.app` (also
`invoice-example-hamasmart.vercel.app`). Deployed 2026-08-28.

**What it is:** hand-written Next.js (App Router + TS) app impersonating 8 Japanese
invoice-delivery patterns, keyed on the HTTP Host header. Full docs in its `README.md`
(265 lines — quick start, host table, language design, PDF recipe). Key facts:

- 8 hosts: `inv2-direct`, `inv2-direct-url`, `inv2-email-gated`, `inv2-login`,
  `inv2-login-pw`, `inv2-email-otp`, `inv2-email-otp-trigger`, `inv2-about-blank` (trap).
- Every response carries `x-sim-fixture` / `x-sim-pattern-type` headers.
- UI is EN-default with `?lang=ja` switcher (sticky cookie); **selector ids identical in both
  languages**; the generated NTA qualified-invoice PDF is always Japanese (vendored M PLUS 1p
  font, text-extractable, T+13-digit 登録番号, 税率別合計 10%/8%).
- API: `api/invoice.pdf` (`?n=`, `?empty=1`, `?htmlfile=1`, `?jsonerr=1`),
  `api/direct-url`, `api/about-blank`, `api/sim/{download,gate,login,otp/send,otp/verify}`.
- Uses `proxy.ts` (Next 16 convention — middleware deprecation already handled).

**Verified live (2026-08-28):** x-sim headers on all 7 pattern hosts · `%PDF-` magic ·
`?empty=1`→204 · about-blank trap · `#username/#password/#login-submit` ·
`#send-code` present with `#code` absent until triggered.

**Remaining gaps:**
1. **Aliases**: only `inv2-direct.vercel.app` is attached. Attach the other 7:
   `for h in direct-url email-gated login login-pw email-otp email-otp-trigger about-blank; do vercel alias set invoice-example-liard.vercel.app inv2-$h.vercel.app --scope hamasmart; done`
2. **Email fixture endpoint (M3)** not implemented — the 24 planned email cases
   (12 invoice-positive / 7 exclusions / 5 traps incl. tracker-wrap + gdrive/gmail links)
   are specced in `plans/invoice-platforms/simulator-v2-fixture-spec.md` §2.
3. **E2E acceptance (T1–T7)** not yet run against dev — register hosts in DEV
   `/invoice-platforms` only (fill `example_url`!), never fire fixtures at prod. Retire the
   8 old `inv-sim-*` Vercel projects only after T1–T7 pass.

**Superseded sibling:** `/Users/necro/DEV/OPSGUIDE/invoice/invoice-platform-simulator` — an
earlier M0+M1 scaffold (own git, commit `b3c6c34`, local only) built before this project took
over. Keep as reference or delete; `invoice-example` is the live one.

## 2. Platform databank — all data available for testing

All files under `/Users/necro/DEV/OPSGUIDE/invoice/plans/invoice-platforms/` —
**`plans/` is gitignored, local-only: copy this folder to the new PC manually.**

| File | Contents |
|---|---|
| `pattern-types-and-registry.md` | The 7 pattern_types (authoritative from code) + LIVE dev (14 rows) & prod (17 rows) registries as of 2026-08-27, incl. 5 new findings (prod duplicate rows, gdrive/gmail junk platforms, sim fixtures in prod, inv-sim-login re-poisoning, stale repairs) |
| `invoice-url-databank.md` | 29 services merged: 8 production URL shapes + 14 doc-verified public patterns + traps |
| `invoice-delivery-url-databank-raw.md` | Curated web-research version: 11 tokenized-link + 10 login-portal shapes, each with auth, confidence, source |
| `simulator-v2-fixture-spec.md` | The design: 8 hosts, 11 failure params, 24 email cases, NTA PDF recipe |
| `simulator-spec-requirements-detailed.md` | Self-contained requirements doc (Parts A–H) for re-scoping in a fresh project |
| `simulator-implementation-complete.md` | Copy-pasteable M0+M1 source + font procedure (for the superseded scaffold; still useful reference) |
| `simulator-agent-safety-rules.md` | Agent rules for the simulator repo (no commit/push/deploy by agents) |
| `perplexity-japanese-invoice-examples.md` + `japanese_invoice_delivery_fixture_catalog.md` (in `plans/`) | The research prompt + Perplexity fixture catalog (email templates, exclusion cues, NTA recipe sources) |

### Quick platform reference (live registries, 2026-08-27)

- **7 pattern types:** direct (default) · direct_url (selectorless) · email_gated · login ·
  login_password_only · email_password · email_password_triggered
- **Dev registered (real vendors):** app.misoca.jp, billing-robo.jp, customer.hajimari.works,
  download.transfer.hennge.com (neg), id.moneyforward.com (neg), invoice.moneyforward.com,
  invoice.secure.freee.co.jp, pay.stripe.com + 6 inv-sim-v1 fixtures
- **Prod registered:** misoca, hajimari, invoice.moneyforward.com (42/0, EMPTY selector —
  needs Regenerate), freee (6/0, EMPTY selector), apps.nulab.com (neg), fc.i-securedeliver.jp
  (0/7), about:blank junk (delete), drive/mail.google.com junk ×2 each (delete),
  inv-sim v1 rows ×2 each (cleanup)
- **Doc-verified public URL shapes for more fixtures:** Stripe `invoice.stripe.com/i/acct_…`,
  Square `squareup.com/pay-invoice/…`, PayPal `…/payerView/details/INV2-…`, Active!gate
  `<fqdn>.activegate-ss.jp/d/?<hex32>`, 楽楽明細 `rb<slug>.eco-serv.jp/<co>/mypage/`,
  クリプト便 `<tenant>.cryptobin.jp/crypto/usr_index.action`, Bill One
  `app.bill-one.com/invite/<slug>-<token>`, MF掛け払い `b.mfk.jp`, plus Paid/ヤマト/佐川/
  クロネコ掛け払い/MakeLeaps/Infomart portals (full table in the databank files)

## 3. Other machine-local assets to carry (if needed)

- **Bastion PEM keys** (dev/prod DB read access):
  `/Users/necro/DEV/OPSGUIDE/TSK-86/invoice-system-context/ssh-keys/{d01-opsguide-20240512,p01-opsguide-20240305}.pem`
  Tunnels + read-only registry SQL: see `pattern-types-and-registry.md` §4.
- **Unpushed opsguide work (exists ONLY on this PC):** opsguide-back branches
  `feature/invoice-ledger-reconcile-v2-2026-08-27` (4515a55f5) and
  `feature/invoice-ledger-idempotent-callback-2026-08-27` (e0ac62855);
  webrpa-playwright-batch `feature/invoice-artifact-validation-2026-08-27` (e18aa8a) —
  the zero-migration hardening Items 1–3 (Item 4 LLM gateway already shipped to prod).
  Push them as checkpoint branches before relying on the new PC.
- **Vercel access:** `vercel login` as `ragil-6291`, scope `hamasmart`. The 8 old
  `inv-sim-*` projects live there too (v1 — keep until v2 passes T1–T7).

## 4. Move checklist

- [ ] Copy `/Users/necro/DEV/OPSGUIDE/invoice-example` (minus node_modules) → new PC; `npm install`; consider `git init` + private remote
- [ ] Copy `/Users/necro/DEV/OPSGUIDE/invoice/plans/` (all local-only docs incl. this handoff's databank)
- [ ] Copy TSK-86 ssh-keys (or keep DB access on this machine only)
- [ ] Decide fate of unpushed opsguide branches (push as checkpoints vs leave here)
- [ ] On new PC: `vercel login` → `vercel link` in invoice-example → run the 7 alias commands
- [ ] Build M3 (email fixtures) per spec §2, then run T1–T7 against dev
