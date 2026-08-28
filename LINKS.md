# All Fixture Links — Every Variant

> Exhaustive URL catalog for the invoice platform fixture suite: every host, every
> parameter variant, and every obstruction combination. Generated to accompany
> `TEST-CASES.md` (which carries the expected ledger outcomes and registry assertions per
> case) and `DEPLOYMENT.md` (how the domains are wired).

**Two equivalent forms for every link:**

| Form | Shape |
|---|---|
| Production | `https://<host>.vercel.app<path>?<params>` |
| Local | `http://localhost:3000<path>?__host=<host>&<params>` |

The `?__host=` override always wins over the `Host` header, so the local form works on plain
`localhost`. `http://<host>.localhost:3000/` also works in modern browsers.

Constants: `sim-user@example.test` / `sim-password-2026`, OTP code `424242`.

The **HTTP** column is the status code measured against live production on 2026-08-28
(every production link in this file was requested, not sampled). Two things that column
makes visible and are easy to get wrong:

- `?htmlfile=1` and `?jsonerr=1` return **200 on purpose** — they look fine at the HTTP
  layer and only artifact validation catches them. That is the point of those fixtures.
- `?slow=30` / `?slow=120` on a *page* return immediately: the delay is client-side, on the
  download element appearing. Only `slow` on a **PDF endpoint** delays the response itself.

Statuses reachable only after interaction are not in that column, because a bare GET cannot
produce them: the OTP wrong-code lock (`423`), resend cooldown (`429`), expired code (`410`),
and the `wrongpin` refusals (`401`) all come from POSTs to `/api/sim/*` after a form step.
`TEST-CASES.md` covers those flows.

---

## 1. Host roots

| Host | `pattern_type` | HTTP | Production | Local |
|---|---|---|---|---|
| `inv2-direct` | `direct` | `200` | <https://inv2-direct.vercel.app/> | <http://localhost:3000/?__host=inv2-direct> |
| `inv2-direct-url` | `direct_url` | `200` | <https://inv2-direct-url.vercel.app/> | <http://localhost:3000/?__host=inv2-direct-url> |
| `inv2-email-gated` | `email_gated` | `200` | <https://inv2-email-gated.vercel.app/> | <http://localhost:3000/?__host=inv2-email-gated> |
| `inv2-login` | `login` | `200` | <https://inv2-login.vercel.app/> | <http://localhost:3000/?__host=inv2-login> |
| `inv2-login-pw` | `login_password_only` | `200` | <https://inv2-login-pw.vercel.app/> | <http://localhost:3000/?__host=inv2-login-pw> |
| `inv2-email-otp` | `email_password` | `200` | <https://inv2-email-otp.vercel.app/> | <http://localhost:3000/?__host=inv2-email-otp> |
| `inv2-email-otp-trigger` | `email_password_triggered` | `200` | <https://inv2-email-otp-trigger.vercel.app/> | <http://localhost:3000/?__host=inv2-email-otp-trigger> |
| `inv2-about-blank` | `trap` | `200` | <https://inv2-about-blank.vercel.app/> | <http://localhost:3000/?__host=inv2-about-blank> |

Fixture index (lists all hosts): <https://invoice-example-liard.vercel.app/>

---

## 2. Per-host variants

### 2.1 `inv2-direct` — `direct`

Preview page + download button (Bill One shaped).

| Variant | What it does | Expected outcome | HTTP | Production URL | Local URL |
|---|---|---|---|---|---|
| `/` (baseline) | Happy path — `#download-invoice` present | stored | `200` | <https://inv2-direct.vercel.app/> | <http://localhost:3000/?__host=inv2-direct> |
| `/d/anytoken123` | Tokenized invite URL, same page and selector | stored | `200` | <https://inv2-direct.vercel.app/d/anytoken123> | <http://localhost:3000/d/anytoken123?__host=inv2-direct> |
| `?selector=v2` | Element becomes `<a class="dl-link-v2">`, no id — forces re-detection | stored (selector re-detected) | `200` | <https://inv2-direct.vercel.app/?selector=v2> | <http://localhost:3000/?__host=inv2-direct&selector=v2> |
| `?multi=1` | Single download link, explicit | stored | `200` | <https://inv2-direct.vercel.app/?multi=1> | <http://localhost:3000/?__host=inv2-direct&multi=1> |
| `?multi=3` | 3 links `#download-invoice-1..3`, distinct invoice numbers | 3 invoices stored | `200` | <https://inv2-direct.vercel.app/?multi=3> | <http://localhost:3000/?__host=inv2-direct&multi=3> |
| `?multi=10` | Max fan-out (10 links) | 10 invoices stored | `200` | <https://inv2-direct.vercel.app/?multi=10> | <http://localhost:3000/?__host=inv2-direct&multi=10> |
| `?slow=5` | Download element renders after 5s | stored if timeout > 5s | `200` | <https://inv2-direct.vercel.app/?slow=5> | <http://localhost:3000/?__host=inv2-direct&slow=5> |
| `?slow=30` | Download element renders after 30s | stored if timeout > 30s | `200` | <https://inv2-direct.vercel.app/?slow=30> | <http://localhost:3000/?__host=inv2-direct&slow=30> |
| `?slow=120` | Maximum delay (clamped at 120s) | stored if timeout > 120s | `200` | <https://inv2-direct.vercel.app/?slow=120> | <http://localhost:3000/?__host=inv2-direct&slow=120> |
| `?expired=1` | 期限切れ notice, **no download element at all** | failed | `200` | <https://inv2-direct.vercel.app/?expired=1> | <http://localhost:3000/?__host=inv2-direct&expired=1> |
| `?popup=1` | Dismissible modal over the card | stored after closing | `200` | <https://inv2-direct.vercel.app/?popup=1> | <http://localhost:3000/?__host=inv2-direct&popup=1> |
| `?popup=2` | Permanent modal trap — close never works | failed (T3.2) | `200` | <https://inv2-direct.vercel.app/?popup=2> | <http://localhost:3000/?__host=inv2-direct&popup=2> |
| `?popup=trap` | Alias of `popup=2` | failed | `200` | <https://inv2-direct.vercel.app/?popup=trap> | <http://localhost:3000/?__host=inv2-direct&popup=trap> |
| `?empty=1` | Download yields 204 No Content | failed | `200` | <https://inv2-direct.vercel.app/?empty=1> | <http://localhost:3000/?__host=inv2-direct&empty=1> |
| `?http500=1` | Download returns 500 | failed | `200` | <https://inv2-direct.vercel.app/?http500=1> | <http://localhost:3000/?__host=inv2-direct&http500=1> |
| `?htmlfile=1` | HTML body with a `.pdf` filename | failed (`html_page`) | `200` | <https://inv2-direct.vercel.app/?htmlfile=1> | <http://localhost:3000/?__host=inv2-direct&htmlfile=1> |
| `?jsonerr=1` | 200 with `{"error":...}` JSON body | failed (`json_error`) | `200` | <https://inv2-direct.vercel.app/?jsonerr=1> | <http://localhost:3000/?__host=inv2-direct&jsonerr=1> |
| `?n=2` | Second invoice number (`…-00002`) | stored, distinct number | `200` | <https://inv2-direct.vercel.app/?n=2> | <http://localhost:3000/?__host=inv2-direct&n=2> |
| `?lang=ja` | Japanese UI (selector ids unchanged) | stored | `200` | <https://inv2-direct.vercel.app/?lang=ja> | <http://localhost:3000/?__host=inv2-direct&lang=ja> |
| `/api/invoice.pdf` | PDF endpoint directly (bypasses the page) | PDF bytes | `200` | <https://inv2-direct.vercel.app/api/invoice.pdf> | <http://localhost:3000/api/invoice.pdf?__host=inv2-direct> |
| `/api/invoice.pdf?n=2` | PDF endpoint, second invoice number | PDF bytes | `200` | <https://inv2-direct.vercel.app/api/invoice.pdf?n=2> | <http://localhost:3000/api/invoice.pdf?__host=inv2-direct&n=2> |
| `/api/invoice.pdf?empty=1` | PDF endpoint → 204 | failed | `204` | <https://inv2-direct.vercel.app/api/invoice.pdf?empty=1> | <http://localhost:3000/api/invoice.pdf?__host=inv2-direct&empty=1> |
| `/api/invoice.pdf?http500=1` | PDF endpoint → 500 | failed | `500` | <https://inv2-direct.vercel.app/api/invoice.pdf?http500=1> | <http://localhost:3000/api/invoice.pdf?__host=inv2-direct&http500=1> |
| `/api/invoice.pdf?htmlfile=1` | PDF endpoint → HTML trap | failed | `200` | <https://inv2-direct.vercel.app/api/invoice.pdf?htmlfile=1> | <http://localhost:3000/api/invoice.pdf?__host=inv2-direct&htmlfile=1> |
| `/api/invoice.pdf?jsonerr=1` | PDF endpoint → JSON error | failed | `200` | <https://inv2-direct.vercel.app/api/invoice.pdf?jsonerr=1> | <http://localhost:3000/api/invoice.pdf?__host=inv2-direct&jsonerr=1> |
| `/api/invoice.pdf?slow=10` | PDF endpoint delayed 10s | PDF bytes after 10s | `200` | <https://inv2-direct.vercel.app/api/invoice.pdf?slow=10> | <http://localhost:3000/api/invoice.pdf?__host=inv2-direct&slow=10> |

### 2.2 `inv2-direct-url` — `direct_url`

No page, no selector — the URL is the download.

| Variant | What it does | Expected outcome | HTTP | Production URL | Local URL |
|---|---|---|---|---|---|
| `/` (baseline) | Root path serves the PDF directly | stored | `200` | <https://inv2-direct-url.vercel.app/> | <http://localhost:3000/?__host=inv2-direct-url> |
| `/any/path` | Arbitrary path — same PDF | stored | `200` | <https://inv2-direct-url.vercel.app/any/path> | <http://localhost:3000/any/path?__host=inv2-direct-url> |
| `/reports/2026/08/invoice.pdf?sig=AKIAI44QH8DHBEXAMPLE&Expires=1790000000` | Signed-URL-shaped path + params (cosmetic) | stored | `200` | <https://inv2-direct-url.vercel.app/reports/2026/08/invoice.pdf?sig=AKIAI44QH8DHBEXAMPLE&Expires=1790000000> | <http://localhost:3000/reports/2026/08/invoice.pdf?__host=inv2-direct-url&sig=AKIAI44QH8DHBEXAMPLE&Expires=1790000000> |
| `?empty=1` | 204 No Content | failed | `204` | <https://inv2-direct-url.vercel.app/?empty=1> | <http://localhost:3000/?__host=inv2-direct-url&empty=1> |
| `?http500=1` | 500 Internal Server Error | failed | `500` | <https://inv2-direct-url.vercel.app/?http500=1> | <http://localhost:3000/?__host=inv2-direct-url&http500=1> |
| `?htmlfile=1` | HTML disguised with a `.pdf` filename | failed (`html_page`) | `200` | <https://inv2-direct-url.vercel.app/?htmlfile=1> | <http://localhost:3000/?__host=inv2-direct-url&htmlfile=1> |
| `?jsonerr=1` | JSON error body, HTTP 200 | failed (`json_error`) | `200` | <https://inv2-direct-url.vercel.app/?jsonerr=1> | <http://localhost:3000/?__host=inv2-direct-url&jsonerr=1> |
| `?slow=5` | PDF after a 5s delay | stored if timeout > 5s | `200` | <https://inv2-direct-url.vercel.app/?slow=5> | <http://localhost:3000/?__host=inv2-direct-url&slow=5> |
| `?n=2` | Second invoice number | stored, distinct number | `200` | <https://inv2-direct-url.vercel.app/?n=2> | <http://localhost:3000/?__host=inv2-direct-url&n=2> |

### 2.3 `inv2-email-gated` — `email_gated`

Email-address gate (synthetic shape).

| Variant | What it does | Expected outcome | HTTP | Production URL | Local URL |
|---|---|---|---|---|---|
| `/` (baseline) | Variant A — `#gate-email` + `#gate-submit` reveal `#download-invoice` | stored | `200` | <https://inv2-email-gated.vercel.app/> | <http://localhost:3000/?__host=inv2-email-gated> |
| `?variant=b` | Variant B — one-time `/d/<token>` link in a DRY-RUN block | stored via link | `200` | <https://inv2-email-gated.vercel.app/?variant=b> | <http://localhost:3000/?__host=inv2-email-gated&variant=b> |
| `?variant=b&expired=1` | Variant B issuing an already-expired link | failed | `200` | <https://inv2-email-gated.vercel.app/?variant=b&expired=1> | <http://localhost:3000/?__host=inv2-email-gated&variant=b&expired=1> |
| `?wrongpin=1` | Well-formed email still refused (401) | failed | `200` | <https://inv2-email-gated.vercel.app/?wrongpin=1> | <http://localhost:3000/?__host=inv2-email-gated&wrongpin=1> |
| `?popup=1` | Dismissible modal over the gate form | stored after closing | `200` | <https://inv2-email-gated.vercel.app/?popup=1> | <http://localhost:3000/?__host=inv2-email-gated&popup=1> |
| `?popup=2` | Permanent modal trap over the gate form | failed | `200` | <https://inv2-email-gated.vercel.app/?popup=2> | <http://localhost:3000/?__host=inv2-email-gated&popup=2> |
| `?lang=ja` | Japanese UI | stored | `200` | <https://inv2-email-gated.vercel.app/?lang=ja> | <http://localhost:3000/?__host=inv2-email-gated&lang=ja> |

### 2.4 `inv2-login` — `login`

Username + password, then 3-month history.

| Variant | What it does | Expected outcome | HTTP | Production URL | Local URL |
|---|---|---|---|---|---|
| `/` (baseline) | `#username` + `#password` + `#login-submit` | stored per month | `200` | <https://inv2-login.vercel.app/> | <http://localhost:3000/?__host=inv2-login> |
| `?relogin=1` | First download OK, second bounces to login (401) | 1st stored, then re-login | `200` | <https://inv2-login.vercel.app/?relogin=1> | <http://localhost:3000/?__host=inv2-login&relogin=1> |
| `?wrongpin=1` | Correct credentials still refused (401) | failed | `200` | <https://inv2-login.vercel.app/?wrongpin=1> | <http://localhost:3000/?__host=inv2-login&wrongpin=1> |
| `?popup=1` | Dismissible modal over the login form | stored after closing | `200` | <https://inv2-login.vercel.app/?popup=1> | <http://localhost:3000/?__host=inv2-login&popup=1> |
| `?popup=2` | Permanent modal trap over the login form | failed | `200` | <https://inv2-login.vercel.app/?popup=2> | <http://localhost:3000/?__host=inv2-login&popup=2> |
| `?lang=ja` | Japanese UI | stored | `200` | <https://inv2-login.vercel.app/?lang=ja> | <http://localhost:3000/?__host=inv2-login&lang=ja> |
| `/api/sim/download?ym=202608` | Session-gated download (401 without cookie) | PDF with session | `401` | <https://inv2-login.vercel.app/api/sim/download?ym=202608> | <http://localhost:3000/api/sim/download?__host=inv2-login&ym=202608> |

### 2.5 `inv2-login-pw` — `login_password_only`

Password only, locks after 5 wrong tries.

| Variant | What it does | Expected outcome | HTTP | Production URL | Local URL |
|---|---|---|---|---|---|
| `/` (baseline) | `#password` + `#login-submit` only (no username field) | stored per month | `200` | <https://inv2-login-pw.vercel.app/> | <http://localhost:3000/?__host=inv2-login-pw> |
| `?wrongpin=1` | Correct password still refused (401) | failed | `200` | <https://inv2-login-pw.vercel.app/?wrongpin=1> | <http://localhost:3000/?__host=inv2-login-pw&wrongpin=1> |
| `?popup=1` | Dismissible modal over the password form | stored after closing | `200` | <https://inv2-login-pw.vercel.app/?popup=1> | <http://localhost:3000/?__host=inv2-login-pw&popup=1> |
| `?popup=2` | Permanent modal trap | failed | `200` | <https://inv2-login-pw.vercel.app/?popup=2> | <http://localhost:3000/?__host=inv2-login-pw&popup=2> |
| `?lang=ja` | Japanese UI | stored | `200` | <https://inv2-login-pw.vercel.app/?lang=ja> | <http://localhost:3000/?__host=inv2-login-pw&lang=ja> |
| `/api/sim/download?ym=202608` | Session-gated download | PDF with session | `401` | <https://inv2-login-pw.vercel.app/api/sim/download?ym=202608> | <http://localhost:3000/api/sim/download?__host=inv2-login-pw&ym=202608> |

### 2.6 `inv2-email-otp` — `email_password`

Code auto-sent on open; id-less submit button.

| Variant | What it does | Expected outcome | HTTP | Production URL | Local URL |
|---|---|---|---|---|---|
| `/` (baseline) | Code auto-sent; `#code` + id-less `button[type=submit]` | stored | `200` | <https://inv2-email-otp.vercel.app/> | <http://localhost:3000/?__host=inv2-email-otp> |
| `?expired=1` | Code already expired (410) | failed | `200` | <https://inv2-email-otp.vercel.app/?expired=1> | <http://localhost:3000/?__host=inv2-email-otp&expired=1> |
| `?wrongpin=1` | Correct code `424242` still refused (401) | failed | `200` | <https://inv2-email-otp.vercel.app/?wrongpin=1> | <http://localhost:3000/?__host=inv2-email-otp&wrongpin=1> |
| `?popup=1` | Dismissible modal over the code form | stored after closing | `200` | <https://inv2-email-otp.vercel.app/?popup=1> | <http://localhost:3000/?__host=inv2-email-otp&popup=1> |
| `?popup=2` | Permanent modal trap | failed | `200` | <https://inv2-email-otp.vercel.app/?popup=2> | <http://localhost:3000/?__host=inv2-email-otp&popup=2> |
| `?lang=ja` | Japanese UI | stored | `200` | <https://inv2-email-otp.vercel.app/?lang=ja> | <http://localhost:3000/?__host=inv2-email-otp&lang=ja> |
| `/api/sim/download?ym=202608` | OTP-session-gated download | PDF with session | `401` | <https://inv2-email-otp.vercel.app/api/sim/download?ym=202608> | <http://localhost:3000/api/sim/download?__host=inv2-email-otp&ym=202608> |

### 2.7 `inv2-email-otp-trigger` — `email_password_triggered`

#code absent until #send-code pressed.

| Variant | What it does | Expected outcome | HTTP | Production URL | Local URL |
|---|---|---|---|---|---|
| `/` (baseline) | Landing page: `#send-code` only, **no `id="code"`** | stored after trigger | `200` | <https://inv2-email-otp-trigger.vercel.app/> | <http://localhost:3000/?__host=inv2-email-otp-trigger> |
| `?expired=1` | Code already expired (410) | failed | `200` | <https://inv2-email-otp-trigger.vercel.app/?expired=1> | <http://localhost:3000/?__host=inv2-email-otp-trigger&expired=1> |
| `?wrongpin=1` | Correct code still refused (401) | failed | `200` | <https://inv2-email-otp-trigger.vercel.app/?wrongpin=1> | <http://localhost:3000/?__host=inv2-email-otp-trigger&wrongpin=1> |
| `?popup=1` | Dismissible modal over `#send-code` | stored after closing | `200` | <https://inv2-email-otp-trigger.vercel.app/?popup=1> | <http://localhost:3000/?__host=inv2-email-otp-trigger&popup=1> |
| `?popup=2` | Permanent modal trap | failed | `200` | <https://inv2-email-otp-trigger.vercel.app/?popup=2> | <http://localhost:3000/?__host=inv2-email-otp-trigger&popup=2> |
| `?lang=ja` | Japanese UI | stored | `200` | <https://inv2-email-otp-trigger.vercel.app/?lang=ja> | <http://localhost:3000/?__host=inv2-email-otp-trigger&lang=ja> |

### 2.8 `inv2-about-blank` — `trap`

Bounces to about:blank — never register.

| Variant | What it does | Expected outcome | HTTP | Production URL | Local URL |
|---|---|---|---|---|---|
| `/` (baseline) | Meta-refresh + `location.replace` to `about:blank` | **no platform row** | `200` | <https://inv2-about-blank.vercel.app/> | <http://localhost:3000/?__host=inv2-about-blank> |
| `/whatever` | Any path behaves identically | **no platform row** | `200` | <https://inv2-about-blank.vercel.app/whatever> | <http://localhost:3000/whatever?__host=inv2-about-blank> |
| `/invoice/download` | Invoice-looking path, still the trap | **no platform row** | `200` | <https://inv2-about-blank.vercel.app/invoice/download> | <http://localhost:3000/invoice/download?__host=inv2-about-blank> |

---

## 3. Obstruction variants (`?obstruct=`)

Supported on `inv2-direct` and the five credential hosts (not on `inv2-direct-url`, which
has no page, nor on the `inv2-about-blank` trap). Unknown types are ignored silently.
Blocker element is `#obstruct-<type>`; dismiss control as listed.

### 3.1 Type reference

| Type | What it does | Blocker selector | Dismiss |
|---|---|---|---|
| `cookie-banner` | Fixed bottom bar covering the primary action | `#obstruct-cookie-banner` | `#obstruct-cookie-accept` |
| `toast` | Top-right notification, auto-hides after 5s (timing race) | `#obstruct-toast` | `— (auto)` |
| `toast-sticky` | Toast parked over the action, never auto-hides | `#obstruct-toast-sticky` | `#obstruct-toast-sticky-close` |
| `chat-widget` | Support bubble covering the bottom-right corner | `#obstruct-chat-widget` | `#obstruct-chat-widget-close` |
| `invisible-overlay` | Transparent hit area — button looks clickable, clicks vanish | `#obstruct-invisible-overlay` | `— (not dismissible)` |
| `sticky-header` | Tall fixed header — scrollIntoView parks target underneath | `#obstruct-sticky-header` | `— (not dismissible)` |
| `spinner` | Loading overlay that never resolves | `#obstruct-spinner` | `— (not dismissible)` |
| `spinner:5` | Loading overlay that clears after 5s | `#obstruct-spinner` | `— (self-resolves)` |
| `delayed-modal` | Modal appears 3s after load (default) | `#obstruct-delayed-modal` | `#obstruct-delayed-modal-close` |
| `delayed-modal:10` | Modal appears 10s after load | `#obstruct-delayed-modal` | `#obstruct-delayed-modal-close` |
| `scroll-lock` | body overflow:hidden + tall spacer — action unreachable | `#obstruct-scroll-lock` | `— (not dismissible)` |
| `alert` | window.alert() on mount — native dialog | `— (native)` | `dialog handler` |
| `confirm` | window.confirm() gates the action click; cancel = no download | `— (native)` | `dialog handler` |
| `prompt` | window.prompt() on mount — native dialog | `— (native)` | `dialog handler` |
| `beforeunload` | Arms the browser's “Leave site?” dialog | `— (native)` | `dialog handler` |
| `new-window` | window.open() steals focus before the action proceeds | `— (no DOM)` | `close extra page` |

### 3.2 `inv2-direct` — all 16 obstruction links

| Type | HTTP | Production URL | Local URL |
|---|---|---|---|
| `cookie-banner` | `200` | <https://inv2-direct.vercel.app/?obstruct=cookie-banner> | <http://localhost:3000/?__host=inv2-direct&obstruct=cookie-banner> |
| `toast` | `200` | <https://inv2-direct.vercel.app/?obstruct=toast> | <http://localhost:3000/?__host=inv2-direct&obstruct=toast> |
| `toast-sticky` | `200` | <https://inv2-direct.vercel.app/?obstruct=toast-sticky> | <http://localhost:3000/?__host=inv2-direct&obstruct=toast-sticky> |
| `chat-widget` | `200` | <https://inv2-direct.vercel.app/?obstruct=chat-widget> | <http://localhost:3000/?__host=inv2-direct&obstruct=chat-widget> |
| `invisible-overlay` | `200` | <https://inv2-direct.vercel.app/?obstruct=invisible-overlay> | <http://localhost:3000/?__host=inv2-direct&obstruct=invisible-overlay> |
| `sticky-header` | `200` | <https://inv2-direct.vercel.app/?obstruct=sticky-header> | <http://localhost:3000/?__host=inv2-direct&obstruct=sticky-header> |
| `spinner` | `200` | <https://inv2-direct.vercel.app/?obstruct=spinner> | <http://localhost:3000/?__host=inv2-direct&obstruct=spinner> |
| `spinner:5` | `200` | <https://inv2-direct.vercel.app/?obstruct=spinner:5> | <http://localhost:3000/?__host=inv2-direct&obstruct=spinner:5> |
| `delayed-modal` | `200` | <https://inv2-direct.vercel.app/?obstruct=delayed-modal> | <http://localhost:3000/?__host=inv2-direct&obstruct=delayed-modal> |
| `delayed-modal:10` | `200` | <https://inv2-direct.vercel.app/?obstruct=delayed-modal:10> | <http://localhost:3000/?__host=inv2-direct&obstruct=delayed-modal:10> |
| `scroll-lock` | `200` | <https://inv2-direct.vercel.app/?obstruct=scroll-lock> | <http://localhost:3000/?__host=inv2-direct&obstruct=scroll-lock> |
| `alert` | `200` | <https://inv2-direct.vercel.app/?obstruct=alert> | <http://localhost:3000/?__host=inv2-direct&obstruct=alert> |
| `confirm` | `200` | <https://inv2-direct.vercel.app/?obstruct=confirm> | <http://localhost:3000/?__host=inv2-direct&obstruct=confirm> |
| `prompt` | `200` | <https://inv2-direct.vercel.app/?obstruct=prompt> | <http://localhost:3000/?__host=inv2-direct&obstruct=prompt> |
| `beforeunload` | `200` | <https://inv2-direct.vercel.app/?obstruct=beforeunload> | <http://localhost:3000/?__host=inv2-direct&obstruct=beforeunload> |
| `new-window` | `200` | <https://inv2-direct.vercel.app/?obstruct=new-window> | <http://localhost:3000/?__host=inv2-direct&obstruct=new-window> |

### 3.3 `inv2-email-gated` — all 16 obstruction links

| Type | HTTP | Production URL | Local URL |
|---|---|---|---|
| `cookie-banner` | `200` | <https://inv2-email-gated.vercel.app/?obstruct=cookie-banner> | <http://localhost:3000/?__host=inv2-email-gated&obstruct=cookie-banner> |
| `toast` | `200` | <https://inv2-email-gated.vercel.app/?obstruct=toast> | <http://localhost:3000/?__host=inv2-email-gated&obstruct=toast> |
| `toast-sticky` | `200` | <https://inv2-email-gated.vercel.app/?obstruct=toast-sticky> | <http://localhost:3000/?__host=inv2-email-gated&obstruct=toast-sticky> |
| `chat-widget` | `200` | <https://inv2-email-gated.vercel.app/?obstruct=chat-widget> | <http://localhost:3000/?__host=inv2-email-gated&obstruct=chat-widget> |
| `invisible-overlay` | `200` | <https://inv2-email-gated.vercel.app/?obstruct=invisible-overlay> | <http://localhost:3000/?__host=inv2-email-gated&obstruct=invisible-overlay> |
| `sticky-header` | `200` | <https://inv2-email-gated.vercel.app/?obstruct=sticky-header> | <http://localhost:3000/?__host=inv2-email-gated&obstruct=sticky-header> |
| `spinner` | `200` | <https://inv2-email-gated.vercel.app/?obstruct=spinner> | <http://localhost:3000/?__host=inv2-email-gated&obstruct=spinner> |
| `spinner:5` | `200` | <https://inv2-email-gated.vercel.app/?obstruct=spinner:5> | <http://localhost:3000/?__host=inv2-email-gated&obstruct=spinner:5> |
| `delayed-modal` | `200` | <https://inv2-email-gated.vercel.app/?obstruct=delayed-modal> | <http://localhost:3000/?__host=inv2-email-gated&obstruct=delayed-modal> |
| `delayed-modal:10` | `200` | <https://inv2-email-gated.vercel.app/?obstruct=delayed-modal:10> | <http://localhost:3000/?__host=inv2-email-gated&obstruct=delayed-modal:10> |
| `scroll-lock` | `200` | <https://inv2-email-gated.vercel.app/?obstruct=scroll-lock> | <http://localhost:3000/?__host=inv2-email-gated&obstruct=scroll-lock> |
| `alert` | `200` | <https://inv2-email-gated.vercel.app/?obstruct=alert> | <http://localhost:3000/?__host=inv2-email-gated&obstruct=alert> |
| `confirm` | `200` | <https://inv2-email-gated.vercel.app/?obstruct=confirm> | <http://localhost:3000/?__host=inv2-email-gated&obstruct=confirm> |
| `prompt` | `200` | <https://inv2-email-gated.vercel.app/?obstruct=prompt> | <http://localhost:3000/?__host=inv2-email-gated&obstruct=prompt> |
| `beforeunload` | `200` | <https://inv2-email-gated.vercel.app/?obstruct=beforeunload> | <http://localhost:3000/?__host=inv2-email-gated&obstruct=beforeunload> |
| `new-window` | `200` | <https://inv2-email-gated.vercel.app/?obstruct=new-window> | <http://localhost:3000/?__host=inv2-email-gated&obstruct=new-window> |

### 3.4 `inv2-login` — all 16 obstruction links

| Type | HTTP | Production URL | Local URL |
|---|---|---|---|
| `cookie-banner` | `200` | <https://inv2-login.vercel.app/?obstruct=cookie-banner> | <http://localhost:3000/?__host=inv2-login&obstruct=cookie-banner> |
| `toast` | `200` | <https://inv2-login.vercel.app/?obstruct=toast> | <http://localhost:3000/?__host=inv2-login&obstruct=toast> |
| `toast-sticky` | `200` | <https://inv2-login.vercel.app/?obstruct=toast-sticky> | <http://localhost:3000/?__host=inv2-login&obstruct=toast-sticky> |
| `chat-widget` | `200` | <https://inv2-login.vercel.app/?obstruct=chat-widget> | <http://localhost:3000/?__host=inv2-login&obstruct=chat-widget> |
| `invisible-overlay` | `200` | <https://inv2-login.vercel.app/?obstruct=invisible-overlay> | <http://localhost:3000/?__host=inv2-login&obstruct=invisible-overlay> |
| `sticky-header` | `200` | <https://inv2-login.vercel.app/?obstruct=sticky-header> | <http://localhost:3000/?__host=inv2-login&obstruct=sticky-header> |
| `spinner` | `200` | <https://inv2-login.vercel.app/?obstruct=spinner> | <http://localhost:3000/?__host=inv2-login&obstruct=spinner> |
| `spinner:5` | `200` | <https://inv2-login.vercel.app/?obstruct=spinner:5> | <http://localhost:3000/?__host=inv2-login&obstruct=spinner:5> |
| `delayed-modal` | `200` | <https://inv2-login.vercel.app/?obstruct=delayed-modal> | <http://localhost:3000/?__host=inv2-login&obstruct=delayed-modal> |
| `delayed-modal:10` | `200` | <https://inv2-login.vercel.app/?obstruct=delayed-modal:10> | <http://localhost:3000/?__host=inv2-login&obstruct=delayed-modal:10> |
| `scroll-lock` | `200` | <https://inv2-login.vercel.app/?obstruct=scroll-lock> | <http://localhost:3000/?__host=inv2-login&obstruct=scroll-lock> |
| `alert` | `200` | <https://inv2-login.vercel.app/?obstruct=alert> | <http://localhost:3000/?__host=inv2-login&obstruct=alert> |
| `confirm` | `200` | <https://inv2-login.vercel.app/?obstruct=confirm> | <http://localhost:3000/?__host=inv2-login&obstruct=confirm> |
| `prompt` | `200` | <https://inv2-login.vercel.app/?obstruct=prompt> | <http://localhost:3000/?__host=inv2-login&obstruct=prompt> |
| `beforeunload` | `200` | <https://inv2-login.vercel.app/?obstruct=beforeunload> | <http://localhost:3000/?__host=inv2-login&obstruct=beforeunload> |
| `new-window` | `200` | <https://inv2-login.vercel.app/?obstruct=new-window> | <http://localhost:3000/?__host=inv2-login&obstruct=new-window> |

### 3.5 `inv2-login-pw` — all 16 obstruction links

| Type | HTTP | Production URL | Local URL |
|---|---|---|---|
| `cookie-banner` | `200` | <https://inv2-login-pw.vercel.app/?obstruct=cookie-banner> | <http://localhost:3000/?__host=inv2-login-pw&obstruct=cookie-banner> |
| `toast` | `200` | <https://inv2-login-pw.vercel.app/?obstruct=toast> | <http://localhost:3000/?__host=inv2-login-pw&obstruct=toast> |
| `toast-sticky` | `200` | <https://inv2-login-pw.vercel.app/?obstruct=toast-sticky> | <http://localhost:3000/?__host=inv2-login-pw&obstruct=toast-sticky> |
| `chat-widget` | `200` | <https://inv2-login-pw.vercel.app/?obstruct=chat-widget> | <http://localhost:3000/?__host=inv2-login-pw&obstruct=chat-widget> |
| `invisible-overlay` | `200` | <https://inv2-login-pw.vercel.app/?obstruct=invisible-overlay> | <http://localhost:3000/?__host=inv2-login-pw&obstruct=invisible-overlay> |
| `sticky-header` | `200` | <https://inv2-login-pw.vercel.app/?obstruct=sticky-header> | <http://localhost:3000/?__host=inv2-login-pw&obstruct=sticky-header> |
| `spinner` | `200` | <https://inv2-login-pw.vercel.app/?obstruct=spinner> | <http://localhost:3000/?__host=inv2-login-pw&obstruct=spinner> |
| `spinner:5` | `200` | <https://inv2-login-pw.vercel.app/?obstruct=spinner:5> | <http://localhost:3000/?__host=inv2-login-pw&obstruct=spinner:5> |
| `delayed-modal` | `200` | <https://inv2-login-pw.vercel.app/?obstruct=delayed-modal> | <http://localhost:3000/?__host=inv2-login-pw&obstruct=delayed-modal> |
| `delayed-modal:10` | `200` | <https://inv2-login-pw.vercel.app/?obstruct=delayed-modal:10> | <http://localhost:3000/?__host=inv2-login-pw&obstruct=delayed-modal:10> |
| `scroll-lock` | `200` | <https://inv2-login-pw.vercel.app/?obstruct=scroll-lock> | <http://localhost:3000/?__host=inv2-login-pw&obstruct=scroll-lock> |
| `alert` | `200` | <https://inv2-login-pw.vercel.app/?obstruct=alert> | <http://localhost:3000/?__host=inv2-login-pw&obstruct=alert> |
| `confirm` | `200` | <https://inv2-login-pw.vercel.app/?obstruct=confirm> | <http://localhost:3000/?__host=inv2-login-pw&obstruct=confirm> |
| `prompt` | `200` | <https://inv2-login-pw.vercel.app/?obstruct=prompt> | <http://localhost:3000/?__host=inv2-login-pw&obstruct=prompt> |
| `beforeunload` | `200` | <https://inv2-login-pw.vercel.app/?obstruct=beforeunload> | <http://localhost:3000/?__host=inv2-login-pw&obstruct=beforeunload> |
| `new-window` | `200` | <https://inv2-login-pw.vercel.app/?obstruct=new-window> | <http://localhost:3000/?__host=inv2-login-pw&obstruct=new-window> |

### 3.6 `inv2-email-otp` — all 16 obstruction links

| Type | HTTP | Production URL | Local URL |
|---|---|---|---|
| `cookie-banner` | `200` | <https://inv2-email-otp.vercel.app/?obstruct=cookie-banner> | <http://localhost:3000/?__host=inv2-email-otp&obstruct=cookie-banner> |
| `toast` | `200` | <https://inv2-email-otp.vercel.app/?obstruct=toast> | <http://localhost:3000/?__host=inv2-email-otp&obstruct=toast> |
| `toast-sticky` | `200` | <https://inv2-email-otp.vercel.app/?obstruct=toast-sticky> | <http://localhost:3000/?__host=inv2-email-otp&obstruct=toast-sticky> |
| `chat-widget` | `200` | <https://inv2-email-otp.vercel.app/?obstruct=chat-widget> | <http://localhost:3000/?__host=inv2-email-otp&obstruct=chat-widget> |
| `invisible-overlay` | `200` | <https://inv2-email-otp.vercel.app/?obstruct=invisible-overlay> | <http://localhost:3000/?__host=inv2-email-otp&obstruct=invisible-overlay> |
| `sticky-header` | `200` | <https://inv2-email-otp.vercel.app/?obstruct=sticky-header> | <http://localhost:3000/?__host=inv2-email-otp&obstruct=sticky-header> |
| `spinner` | `200` | <https://inv2-email-otp.vercel.app/?obstruct=spinner> | <http://localhost:3000/?__host=inv2-email-otp&obstruct=spinner> |
| `spinner:5` | `200` | <https://inv2-email-otp.vercel.app/?obstruct=spinner:5> | <http://localhost:3000/?__host=inv2-email-otp&obstruct=spinner:5> |
| `delayed-modal` | `200` | <https://inv2-email-otp.vercel.app/?obstruct=delayed-modal> | <http://localhost:3000/?__host=inv2-email-otp&obstruct=delayed-modal> |
| `delayed-modal:10` | `200` | <https://inv2-email-otp.vercel.app/?obstruct=delayed-modal:10> | <http://localhost:3000/?__host=inv2-email-otp&obstruct=delayed-modal:10> |
| `scroll-lock` | `200` | <https://inv2-email-otp.vercel.app/?obstruct=scroll-lock> | <http://localhost:3000/?__host=inv2-email-otp&obstruct=scroll-lock> |
| `alert` | `200` | <https://inv2-email-otp.vercel.app/?obstruct=alert> | <http://localhost:3000/?__host=inv2-email-otp&obstruct=alert> |
| `confirm` | `200` | <https://inv2-email-otp.vercel.app/?obstruct=confirm> | <http://localhost:3000/?__host=inv2-email-otp&obstruct=confirm> |
| `prompt` | `200` | <https://inv2-email-otp.vercel.app/?obstruct=prompt> | <http://localhost:3000/?__host=inv2-email-otp&obstruct=prompt> |
| `beforeunload` | `200` | <https://inv2-email-otp.vercel.app/?obstruct=beforeunload> | <http://localhost:3000/?__host=inv2-email-otp&obstruct=beforeunload> |
| `new-window` | `200` | <https://inv2-email-otp.vercel.app/?obstruct=new-window> | <http://localhost:3000/?__host=inv2-email-otp&obstruct=new-window> |

### 3.7 `inv2-email-otp-trigger` — all 16 obstruction links

| Type | HTTP | Production URL | Local URL |
|---|---|---|---|
| `cookie-banner` | `200` | <https://inv2-email-otp-trigger.vercel.app/?obstruct=cookie-banner> | <http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=cookie-banner> |
| `toast` | `200` | <https://inv2-email-otp-trigger.vercel.app/?obstruct=toast> | <http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=toast> |
| `toast-sticky` | `200` | <https://inv2-email-otp-trigger.vercel.app/?obstruct=toast-sticky> | <http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=toast-sticky> |
| `chat-widget` | `200` | <https://inv2-email-otp-trigger.vercel.app/?obstruct=chat-widget> | <http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=chat-widget> |
| `invisible-overlay` | `200` | <https://inv2-email-otp-trigger.vercel.app/?obstruct=invisible-overlay> | <http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=invisible-overlay> |
| `sticky-header` | `200` | <https://inv2-email-otp-trigger.vercel.app/?obstruct=sticky-header> | <http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=sticky-header> |
| `spinner` | `200` | <https://inv2-email-otp-trigger.vercel.app/?obstruct=spinner> | <http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=spinner> |
| `spinner:5` | `200` | <https://inv2-email-otp-trigger.vercel.app/?obstruct=spinner:5> | <http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=spinner:5> |
| `delayed-modal` | `200` | <https://inv2-email-otp-trigger.vercel.app/?obstruct=delayed-modal> | <http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=delayed-modal> |
| `delayed-modal:10` | `200` | <https://inv2-email-otp-trigger.vercel.app/?obstruct=delayed-modal:10> | <http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=delayed-modal:10> |
| `scroll-lock` | `200` | <https://inv2-email-otp-trigger.vercel.app/?obstruct=scroll-lock> | <http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=scroll-lock> |
| `alert` | `200` | <https://inv2-email-otp-trigger.vercel.app/?obstruct=alert> | <http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=alert> |
| `confirm` | `200` | <https://inv2-email-otp-trigger.vercel.app/?obstruct=confirm> | <http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=confirm> |
| `prompt` | `200` | <https://inv2-email-otp-trigger.vercel.app/?obstruct=prompt> | <http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=prompt> |
| `beforeunload` | `200` | <https://inv2-email-otp-trigger.vercel.app/?obstruct=beforeunload> | <http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=beforeunload> |
| `new-window` | `200` | <https://inv2-email-otp-trigger.vercel.app/?obstruct=new-window> | <http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=new-window> |

### 3.8 Stacked combinations

Any number of types can be combined in one value. Shown on `inv2-direct`; swap the host
for any of the six.

| Combination | What it exercises | HTTP | Production URL |
|---|---|---|---|
| `cookie-banner,chat-widget,toast` | Three DOM blockers stacked | `200` | <https://inv2-direct.vercel.app/?obstruct=cookie-banner,chat-widget,toast> |
| `confirm,beforeunload` | Click gate plus leave-site warning | `200` | <https://inv2-direct.vercel.app/?obstruct=confirm,beforeunload> |
| `spinner:5,delayed-modal:3` | Delayed reveal then a late modal | `200` | <https://inv2-direct.vercel.app/?obstruct=spinner:5,delayed-modal:3> |
| `invisible-overlay,cookie-banner` | Silent click swallow behind a visible banner | `200` | <https://inv2-direct.vercel.app/?obstruct=invisible-overlay,cookie-banner> |
| `alert,prompt,confirm,beforeunload,new-window` | Every native/window blocker at once | `200` | <https://inv2-direct.vercel.app/?obstruct=alert,prompt,confirm,beforeunload,new-window> |
| `sticky-header,scroll-lock` | Target both off-screen and unreachable | `200` | <https://inv2-direct.vercel.app/?obstruct=sticky-header,scroll-lock> |

### 3.9 Obstructions stacked with other params

`?obstruct=` composes with `?popup=`, `?lang=`, and every failure param.

| URL | HTTP | What it exercises |
|---|---|---|
| <https://inv2-direct.vercel.app/?popup=1&obstruct=cookie-banner> | `200` | Modal *and* cookie banner — two layers to clear |
| <https://inv2-direct.vercel.app/?popup=2&obstruct=invisible-overlay> | `200` | Permanent trap behind a silent click swallow |
| <https://inv2-direct.vercel.app/?obstruct=cookie-banner&lang=ja> | `200` | Japanese UI with a banner (ids unchanged) |
| <https://inv2-direct.vercel.app/?obstruct=confirm&empty=1> | `200` | Confirm dialog, then the download 204s anyway |
| <https://inv2-direct.vercel.app/?obstruct=delayed-modal:3&slow=5> | `200` | Button appears at 5s, modal lands at 3s |
| <https://inv2-direct.vercel.app/?obstruct=scroll-lock&multi=3> | `200` | Three links, all unreachable below the fold |

---

## 4. Header check (any host, any path)

```bash
for h in inv2-direct inv2-direct-url inv2-email-gated inv2-login \
         inv2-login-pw inv2-email-otp inv2-email-otp-trigger inv2-about-blank; do
  printf "%-26s " "$h"
  curl -s -o /dev/null -D - "https://$h.vercel.app/" | grep -i "^x-sim-pattern-type"
done
```

Every response also carries `x-sim-fixture` and `x-sim-lang`. All pages are
`noindex, nofollow`.

---

## 5. Rules that apply to all of the above

- **Never register `inv2-about-blank`** as a platform — not even on a run that otherwise
  looks successful. It exists to prove the junk-domain guard holds.
- Register the other seven in the **dev** registry only, fill `example_url` at
  registration, and never fire fixtures at prod.
- `inv2-direct-url` must keep an **empty selector** — that is correct for `direct_url`, and
  usability checks must exempt it.
- Lockouts and cooldowns (`login-pw` 5-try lock, OTP 5-attempt lock, 60s resend cooldown)
  live in httpOnly cookies scoped per host. **Run each case in a fresh browser context**,
  or an earlier case contaminates a later one.
- `?popup=1` is the **dismissible** case and `?popup=2`/`trap` the blocking one — reversed
  from the sim-v1 numbering, so update any expected-outcome table carried over from v1.
- The UI defaults to **English**; add `&lang=ja` when Japanese-text detection fidelity
  matters. Selector ids are identical in both languages; the PDF is always Japanese.

---

## Appendix A — every production link, one per line

Flat list for copy-paste into a test runner, spreadsheet, or `xargs curl`. Same links as the
tables above, in the same order, deduplicated.

```text
https://inv2-direct.vercel.app/
https://inv2-direct-url.vercel.app/
https://inv2-email-gated.vercel.app/
https://inv2-login.vercel.app/
https://inv2-login-pw.vercel.app/
https://inv2-email-otp.vercel.app/
https://inv2-email-otp-trigger.vercel.app/
https://inv2-about-blank.vercel.app/
https://inv2-direct.vercel.app/d/anytoken123
https://inv2-direct.vercel.app/?selector=v2
https://inv2-direct.vercel.app/?multi=1
https://inv2-direct.vercel.app/?multi=3
https://inv2-direct.vercel.app/?multi=10
https://inv2-direct.vercel.app/?slow=5
https://inv2-direct.vercel.app/?slow=30
https://inv2-direct.vercel.app/?slow=120
https://inv2-direct.vercel.app/?expired=1
https://inv2-direct.vercel.app/?popup=1
https://inv2-direct.vercel.app/?popup=2
https://inv2-direct.vercel.app/?popup=trap
https://inv2-direct.vercel.app/?empty=1
https://inv2-direct.vercel.app/?http500=1
https://inv2-direct.vercel.app/?htmlfile=1
https://inv2-direct.vercel.app/?jsonerr=1
https://inv2-direct.vercel.app/?n=2
https://inv2-direct.vercel.app/?lang=ja
https://inv2-direct.vercel.app/api/invoice.pdf
https://inv2-direct.vercel.app/api/invoice.pdf?n=2
https://inv2-direct.vercel.app/api/invoice.pdf?empty=1
https://inv2-direct.vercel.app/api/invoice.pdf?http500=1
https://inv2-direct.vercel.app/api/invoice.pdf?htmlfile=1
https://inv2-direct.vercel.app/api/invoice.pdf?jsonerr=1
https://inv2-direct.vercel.app/api/invoice.pdf?slow=10
https://inv2-direct-url.vercel.app/any/path
https://inv2-direct-url.vercel.app/reports/2026/08/invoice.pdf?sig=AKIAI44QH8DHBEXAMPLE&Expires=1790000000
https://inv2-direct-url.vercel.app/?empty=1
https://inv2-direct-url.vercel.app/?http500=1
https://inv2-direct-url.vercel.app/?htmlfile=1
https://inv2-direct-url.vercel.app/?jsonerr=1
https://inv2-direct-url.vercel.app/?slow=5
https://inv2-direct-url.vercel.app/?n=2
https://inv2-email-gated.vercel.app/?variant=b
https://inv2-email-gated.vercel.app/?variant=b&expired=1
https://inv2-email-gated.vercel.app/?wrongpin=1
https://inv2-email-gated.vercel.app/?popup=1
https://inv2-email-gated.vercel.app/?popup=2
https://inv2-email-gated.vercel.app/?lang=ja
https://inv2-login.vercel.app/?relogin=1
https://inv2-login.vercel.app/?wrongpin=1
https://inv2-login.vercel.app/?popup=1
https://inv2-login.vercel.app/?popup=2
https://inv2-login.vercel.app/?lang=ja
https://inv2-login.vercel.app/api/sim/download?ym=202608
https://inv2-login-pw.vercel.app/?wrongpin=1
https://inv2-login-pw.vercel.app/?popup=1
https://inv2-login-pw.vercel.app/?popup=2
https://inv2-login-pw.vercel.app/?lang=ja
https://inv2-login-pw.vercel.app/api/sim/download?ym=202608
https://inv2-email-otp.vercel.app/?expired=1
https://inv2-email-otp.vercel.app/?wrongpin=1
https://inv2-email-otp.vercel.app/?popup=1
https://inv2-email-otp.vercel.app/?popup=2
https://inv2-email-otp.vercel.app/?lang=ja
https://inv2-email-otp.vercel.app/api/sim/download?ym=202608
https://inv2-email-otp-trigger.vercel.app/?expired=1
https://inv2-email-otp-trigger.vercel.app/?wrongpin=1
https://inv2-email-otp-trigger.vercel.app/?popup=1
https://inv2-email-otp-trigger.vercel.app/?popup=2
https://inv2-email-otp-trigger.vercel.app/?lang=ja
https://inv2-about-blank.vercel.app/whatever
https://inv2-about-blank.vercel.app/invoice/download
https://inv2-direct.vercel.app/?obstruct=cookie-banner
https://inv2-direct.vercel.app/?obstruct=toast
https://inv2-direct.vercel.app/?obstruct=toast-sticky
https://inv2-direct.vercel.app/?obstruct=chat-widget
https://inv2-direct.vercel.app/?obstruct=invisible-overlay
https://inv2-direct.vercel.app/?obstruct=sticky-header
https://inv2-direct.vercel.app/?obstruct=spinner
https://inv2-direct.vercel.app/?obstruct=spinner:5
https://inv2-direct.vercel.app/?obstruct=delayed-modal
https://inv2-direct.vercel.app/?obstruct=delayed-modal:10
https://inv2-direct.vercel.app/?obstruct=scroll-lock
https://inv2-direct.vercel.app/?obstruct=alert
https://inv2-direct.vercel.app/?obstruct=confirm
https://inv2-direct.vercel.app/?obstruct=prompt
https://inv2-direct.vercel.app/?obstruct=beforeunload
https://inv2-direct.vercel.app/?obstruct=new-window
https://inv2-email-gated.vercel.app/?obstruct=cookie-banner
https://inv2-email-gated.vercel.app/?obstruct=toast
https://inv2-email-gated.vercel.app/?obstruct=toast-sticky
https://inv2-email-gated.vercel.app/?obstruct=chat-widget
https://inv2-email-gated.vercel.app/?obstruct=invisible-overlay
https://inv2-email-gated.vercel.app/?obstruct=sticky-header
https://inv2-email-gated.vercel.app/?obstruct=spinner
https://inv2-email-gated.vercel.app/?obstruct=spinner:5
https://inv2-email-gated.vercel.app/?obstruct=delayed-modal
https://inv2-email-gated.vercel.app/?obstruct=delayed-modal:10
https://inv2-email-gated.vercel.app/?obstruct=scroll-lock
https://inv2-email-gated.vercel.app/?obstruct=alert
https://inv2-email-gated.vercel.app/?obstruct=confirm
https://inv2-email-gated.vercel.app/?obstruct=prompt
https://inv2-email-gated.vercel.app/?obstruct=beforeunload
https://inv2-email-gated.vercel.app/?obstruct=new-window
https://inv2-login.vercel.app/?obstruct=cookie-banner
https://inv2-login.vercel.app/?obstruct=toast
https://inv2-login.vercel.app/?obstruct=toast-sticky
https://inv2-login.vercel.app/?obstruct=chat-widget
https://inv2-login.vercel.app/?obstruct=invisible-overlay
https://inv2-login.vercel.app/?obstruct=sticky-header
https://inv2-login.vercel.app/?obstruct=spinner
https://inv2-login.vercel.app/?obstruct=spinner:5
https://inv2-login.vercel.app/?obstruct=delayed-modal
https://inv2-login.vercel.app/?obstruct=delayed-modal:10
https://inv2-login.vercel.app/?obstruct=scroll-lock
https://inv2-login.vercel.app/?obstruct=alert
https://inv2-login.vercel.app/?obstruct=confirm
https://inv2-login.vercel.app/?obstruct=prompt
https://inv2-login.vercel.app/?obstruct=beforeunload
https://inv2-login.vercel.app/?obstruct=new-window
https://inv2-login-pw.vercel.app/?obstruct=cookie-banner
https://inv2-login-pw.vercel.app/?obstruct=toast
https://inv2-login-pw.vercel.app/?obstruct=toast-sticky
https://inv2-login-pw.vercel.app/?obstruct=chat-widget
https://inv2-login-pw.vercel.app/?obstruct=invisible-overlay
https://inv2-login-pw.vercel.app/?obstruct=sticky-header
https://inv2-login-pw.vercel.app/?obstruct=spinner
https://inv2-login-pw.vercel.app/?obstruct=spinner:5
https://inv2-login-pw.vercel.app/?obstruct=delayed-modal
https://inv2-login-pw.vercel.app/?obstruct=delayed-modal:10
https://inv2-login-pw.vercel.app/?obstruct=scroll-lock
https://inv2-login-pw.vercel.app/?obstruct=alert
https://inv2-login-pw.vercel.app/?obstruct=confirm
https://inv2-login-pw.vercel.app/?obstruct=prompt
https://inv2-login-pw.vercel.app/?obstruct=beforeunload
https://inv2-login-pw.vercel.app/?obstruct=new-window
https://inv2-email-otp.vercel.app/?obstruct=cookie-banner
https://inv2-email-otp.vercel.app/?obstruct=toast
https://inv2-email-otp.vercel.app/?obstruct=toast-sticky
https://inv2-email-otp.vercel.app/?obstruct=chat-widget
https://inv2-email-otp.vercel.app/?obstruct=invisible-overlay
https://inv2-email-otp.vercel.app/?obstruct=sticky-header
https://inv2-email-otp.vercel.app/?obstruct=spinner
https://inv2-email-otp.vercel.app/?obstruct=spinner:5
https://inv2-email-otp.vercel.app/?obstruct=delayed-modal
https://inv2-email-otp.vercel.app/?obstruct=delayed-modal:10
https://inv2-email-otp.vercel.app/?obstruct=scroll-lock
https://inv2-email-otp.vercel.app/?obstruct=alert
https://inv2-email-otp.vercel.app/?obstruct=confirm
https://inv2-email-otp.vercel.app/?obstruct=prompt
https://inv2-email-otp.vercel.app/?obstruct=beforeunload
https://inv2-email-otp.vercel.app/?obstruct=new-window
https://inv2-email-otp-trigger.vercel.app/?obstruct=cookie-banner
https://inv2-email-otp-trigger.vercel.app/?obstruct=toast
https://inv2-email-otp-trigger.vercel.app/?obstruct=toast-sticky
https://inv2-email-otp-trigger.vercel.app/?obstruct=chat-widget
https://inv2-email-otp-trigger.vercel.app/?obstruct=invisible-overlay
https://inv2-email-otp-trigger.vercel.app/?obstruct=sticky-header
https://inv2-email-otp-trigger.vercel.app/?obstruct=spinner
https://inv2-email-otp-trigger.vercel.app/?obstruct=spinner:5
https://inv2-email-otp-trigger.vercel.app/?obstruct=delayed-modal
https://inv2-email-otp-trigger.vercel.app/?obstruct=delayed-modal:10
https://inv2-email-otp-trigger.vercel.app/?obstruct=scroll-lock
https://inv2-email-otp-trigger.vercel.app/?obstruct=alert
https://inv2-email-otp-trigger.vercel.app/?obstruct=confirm
https://inv2-email-otp-trigger.vercel.app/?obstruct=prompt
https://inv2-email-otp-trigger.vercel.app/?obstruct=beforeunload
https://inv2-email-otp-trigger.vercel.app/?obstruct=new-window
https://inv2-direct.vercel.app/?obstruct=cookie-banner,chat-widget,toast
https://inv2-direct.vercel.app/?obstruct=confirm,beforeunload
https://inv2-direct.vercel.app/?obstruct=spinner:5,delayed-modal:3
https://inv2-direct.vercel.app/?obstruct=invisible-overlay,cookie-banner
https://inv2-direct.vercel.app/?obstruct=alert,prompt,confirm,beforeunload,new-window
https://inv2-direct.vercel.app/?obstruct=sticky-header,scroll-lock
https://inv2-direct.vercel.app/?popup=1&obstruct=cookie-banner
https://inv2-direct.vercel.app/?popup=2&obstruct=invisible-overlay
https://inv2-direct.vercel.app/?obstruct=cookie-banner&lang=ja
https://inv2-direct.vercel.app/?obstruct=confirm&empty=1
https://inv2-direct.vercel.app/?obstruct=delayed-modal:3&slow=5
https://inv2-direct.vercel.app/?obstruct=scroll-lock&multi=3
```

## Appendix B — every local link, one per line

The same set against `npm run dev` on port 3000, using the `?__host=` override.

```text
http://localhost:3000/?__host=inv2-direct
http://localhost:3000/?__host=inv2-direct-url
http://localhost:3000/?__host=inv2-email-gated
http://localhost:3000/?__host=inv2-login
http://localhost:3000/?__host=inv2-login-pw
http://localhost:3000/?__host=inv2-email-otp
http://localhost:3000/?__host=inv2-email-otp-trigger
http://localhost:3000/?__host=inv2-about-blank
http://localhost:3000/d/anytoken123?__host=inv2-direct
http://localhost:3000/?__host=inv2-direct&selector=v2
http://localhost:3000/?__host=inv2-direct&multi=1
http://localhost:3000/?__host=inv2-direct&multi=3
http://localhost:3000/?__host=inv2-direct&multi=10
http://localhost:3000/?__host=inv2-direct&slow=5
http://localhost:3000/?__host=inv2-direct&slow=30
http://localhost:3000/?__host=inv2-direct&slow=120
http://localhost:3000/?__host=inv2-direct&expired=1
http://localhost:3000/?__host=inv2-direct&popup=1
http://localhost:3000/?__host=inv2-direct&popup=2
http://localhost:3000/?__host=inv2-direct&popup=trap
http://localhost:3000/?__host=inv2-direct&empty=1
http://localhost:3000/?__host=inv2-direct&http500=1
http://localhost:3000/?__host=inv2-direct&htmlfile=1
http://localhost:3000/?__host=inv2-direct&jsonerr=1
http://localhost:3000/?__host=inv2-direct&n=2
http://localhost:3000/?__host=inv2-direct&lang=ja
http://localhost:3000/api/invoice.pdf?__host=inv2-direct
http://localhost:3000/api/invoice.pdf?__host=inv2-direct&n=2
http://localhost:3000/api/invoice.pdf?__host=inv2-direct&empty=1
http://localhost:3000/api/invoice.pdf?__host=inv2-direct&http500=1
http://localhost:3000/api/invoice.pdf?__host=inv2-direct&htmlfile=1
http://localhost:3000/api/invoice.pdf?__host=inv2-direct&jsonerr=1
http://localhost:3000/api/invoice.pdf?__host=inv2-direct&slow=10
http://localhost:3000/any/path?__host=inv2-direct-url
http://localhost:3000/reports/2026/08/invoice.pdf?__host=inv2-direct-url&sig=AKIAI44QH8DHBEXAMPLE&Expires=1790000000
http://localhost:3000/?__host=inv2-direct-url&empty=1
http://localhost:3000/?__host=inv2-direct-url&http500=1
http://localhost:3000/?__host=inv2-direct-url&htmlfile=1
http://localhost:3000/?__host=inv2-direct-url&jsonerr=1
http://localhost:3000/?__host=inv2-direct-url&slow=5
http://localhost:3000/?__host=inv2-direct-url&n=2
http://localhost:3000/?__host=inv2-email-gated&variant=b
http://localhost:3000/?__host=inv2-email-gated&variant=b&expired=1
http://localhost:3000/?__host=inv2-email-gated&wrongpin=1
http://localhost:3000/?__host=inv2-email-gated&popup=1
http://localhost:3000/?__host=inv2-email-gated&popup=2
http://localhost:3000/?__host=inv2-email-gated&lang=ja
http://localhost:3000/?__host=inv2-login&relogin=1
http://localhost:3000/?__host=inv2-login&wrongpin=1
http://localhost:3000/?__host=inv2-login&popup=1
http://localhost:3000/?__host=inv2-login&popup=2
http://localhost:3000/?__host=inv2-login&lang=ja
http://localhost:3000/api/sim/download?__host=inv2-login&ym=202608
http://localhost:3000/?__host=inv2-login-pw&wrongpin=1
http://localhost:3000/?__host=inv2-login-pw&popup=1
http://localhost:3000/?__host=inv2-login-pw&popup=2
http://localhost:3000/?__host=inv2-login-pw&lang=ja
http://localhost:3000/api/sim/download?__host=inv2-login-pw&ym=202608
http://localhost:3000/?__host=inv2-email-otp&expired=1
http://localhost:3000/?__host=inv2-email-otp&wrongpin=1
http://localhost:3000/?__host=inv2-email-otp&popup=1
http://localhost:3000/?__host=inv2-email-otp&popup=2
http://localhost:3000/?__host=inv2-email-otp&lang=ja
http://localhost:3000/api/sim/download?__host=inv2-email-otp&ym=202608
http://localhost:3000/?__host=inv2-email-otp-trigger&expired=1
http://localhost:3000/?__host=inv2-email-otp-trigger&wrongpin=1
http://localhost:3000/?__host=inv2-email-otp-trigger&popup=1
http://localhost:3000/?__host=inv2-email-otp-trigger&popup=2
http://localhost:3000/?__host=inv2-email-otp-trigger&lang=ja
http://localhost:3000/whatever?__host=inv2-about-blank
http://localhost:3000/invoice/download?__host=inv2-about-blank
http://localhost:3000/?__host=inv2-direct&obstruct=cookie-banner
http://localhost:3000/?__host=inv2-direct&obstruct=toast
http://localhost:3000/?__host=inv2-direct&obstruct=toast-sticky
http://localhost:3000/?__host=inv2-direct&obstruct=chat-widget
http://localhost:3000/?__host=inv2-direct&obstruct=invisible-overlay
http://localhost:3000/?__host=inv2-direct&obstruct=sticky-header
http://localhost:3000/?__host=inv2-direct&obstruct=spinner
http://localhost:3000/?__host=inv2-direct&obstruct=spinner:5
http://localhost:3000/?__host=inv2-direct&obstruct=delayed-modal
http://localhost:3000/?__host=inv2-direct&obstruct=delayed-modal:10
http://localhost:3000/?__host=inv2-direct&obstruct=scroll-lock
http://localhost:3000/?__host=inv2-direct&obstruct=alert
http://localhost:3000/?__host=inv2-direct&obstruct=confirm
http://localhost:3000/?__host=inv2-direct&obstruct=prompt
http://localhost:3000/?__host=inv2-direct&obstruct=beforeunload
http://localhost:3000/?__host=inv2-direct&obstruct=new-window
http://localhost:3000/?__host=inv2-email-gated&obstruct=cookie-banner
http://localhost:3000/?__host=inv2-email-gated&obstruct=toast
http://localhost:3000/?__host=inv2-email-gated&obstruct=toast-sticky
http://localhost:3000/?__host=inv2-email-gated&obstruct=chat-widget
http://localhost:3000/?__host=inv2-email-gated&obstruct=invisible-overlay
http://localhost:3000/?__host=inv2-email-gated&obstruct=sticky-header
http://localhost:3000/?__host=inv2-email-gated&obstruct=spinner
http://localhost:3000/?__host=inv2-email-gated&obstruct=spinner:5
http://localhost:3000/?__host=inv2-email-gated&obstruct=delayed-modal
http://localhost:3000/?__host=inv2-email-gated&obstruct=delayed-modal:10
http://localhost:3000/?__host=inv2-email-gated&obstruct=scroll-lock
http://localhost:3000/?__host=inv2-email-gated&obstruct=alert
http://localhost:3000/?__host=inv2-email-gated&obstruct=confirm
http://localhost:3000/?__host=inv2-email-gated&obstruct=prompt
http://localhost:3000/?__host=inv2-email-gated&obstruct=beforeunload
http://localhost:3000/?__host=inv2-email-gated&obstruct=new-window
http://localhost:3000/?__host=inv2-login&obstruct=cookie-banner
http://localhost:3000/?__host=inv2-login&obstruct=toast
http://localhost:3000/?__host=inv2-login&obstruct=toast-sticky
http://localhost:3000/?__host=inv2-login&obstruct=chat-widget
http://localhost:3000/?__host=inv2-login&obstruct=invisible-overlay
http://localhost:3000/?__host=inv2-login&obstruct=sticky-header
http://localhost:3000/?__host=inv2-login&obstruct=spinner
http://localhost:3000/?__host=inv2-login&obstruct=spinner:5
http://localhost:3000/?__host=inv2-login&obstruct=delayed-modal
http://localhost:3000/?__host=inv2-login&obstruct=delayed-modal:10
http://localhost:3000/?__host=inv2-login&obstruct=scroll-lock
http://localhost:3000/?__host=inv2-login&obstruct=alert
http://localhost:3000/?__host=inv2-login&obstruct=confirm
http://localhost:3000/?__host=inv2-login&obstruct=prompt
http://localhost:3000/?__host=inv2-login&obstruct=beforeunload
http://localhost:3000/?__host=inv2-login&obstruct=new-window
http://localhost:3000/?__host=inv2-login-pw&obstruct=cookie-banner
http://localhost:3000/?__host=inv2-login-pw&obstruct=toast
http://localhost:3000/?__host=inv2-login-pw&obstruct=toast-sticky
http://localhost:3000/?__host=inv2-login-pw&obstruct=chat-widget
http://localhost:3000/?__host=inv2-login-pw&obstruct=invisible-overlay
http://localhost:3000/?__host=inv2-login-pw&obstruct=sticky-header
http://localhost:3000/?__host=inv2-login-pw&obstruct=spinner
http://localhost:3000/?__host=inv2-login-pw&obstruct=spinner:5
http://localhost:3000/?__host=inv2-login-pw&obstruct=delayed-modal
http://localhost:3000/?__host=inv2-login-pw&obstruct=delayed-modal:10
http://localhost:3000/?__host=inv2-login-pw&obstruct=scroll-lock
http://localhost:3000/?__host=inv2-login-pw&obstruct=alert
http://localhost:3000/?__host=inv2-login-pw&obstruct=confirm
http://localhost:3000/?__host=inv2-login-pw&obstruct=prompt
http://localhost:3000/?__host=inv2-login-pw&obstruct=beforeunload
http://localhost:3000/?__host=inv2-login-pw&obstruct=new-window
http://localhost:3000/?__host=inv2-email-otp&obstruct=cookie-banner
http://localhost:3000/?__host=inv2-email-otp&obstruct=toast
http://localhost:3000/?__host=inv2-email-otp&obstruct=toast-sticky
http://localhost:3000/?__host=inv2-email-otp&obstruct=chat-widget
http://localhost:3000/?__host=inv2-email-otp&obstruct=invisible-overlay
http://localhost:3000/?__host=inv2-email-otp&obstruct=sticky-header
http://localhost:3000/?__host=inv2-email-otp&obstruct=spinner
http://localhost:3000/?__host=inv2-email-otp&obstruct=spinner:5
http://localhost:3000/?__host=inv2-email-otp&obstruct=delayed-modal
http://localhost:3000/?__host=inv2-email-otp&obstruct=delayed-modal:10
http://localhost:3000/?__host=inv2-email-otp&obstruct=scroll-lock
http://localhost:3000/?__host=inv2-email-otp&obstruct=alert
http://localhost:3000/?__host=inv2-email-otp&obstruct=confirm
http://localhost:3000/?__host=inv2-email-otp&obstruct=prompt
http://localhost:3000/?__host=inv2-email-otp&obstruct=beforeunload
http://localhost:3000/?__host=inv2-email-otp&obstruct=new-window
http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=cookie-banner
http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=toast
http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=toast-sticky
http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=chat-widget
http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=invisible-overlay
http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=sticky-header
http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=spinner
http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=spinner:5
http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=delayed-modal
http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=delayed-modal:10
http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=scroll-lock
http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=alert
http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=confirm
http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=prompt
http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=beforeunload
http://localhost:3000/?__host=inv2-email-otp-trigger&obstruct=new-window
http://localhost:3000/?__host=inv2-direct&obstruct=cookie-banner,chat-widget,toast
http://localhost:3000/?__host=inv2-direct&obstruct=confirm,beforeunload
http://localhost:3000/?__host=inv2-direct&obstruct=spinner:5,delayed-modal:3
http://localhost:3000/?__host=inv2-direct&obstruct=invisible-overlay,cookie-banner
http://localhost:3000/?__host=inv2-direct&obstruct=alert,prompt,confirm,beforeunload,new-window
http://localhost:3000/?__host=inv2-direct&obstruct=sticky-header,scroll-lock
http://localhost:3000/?__host=inv2-direct&popup=1&obstruct=cookie-banner
http://localhost:3000/?__host=inv2-direct&popup=2&obstruct=invisible-overlay
http://localhost:3000/?__host=inv2-direct&obstruct=cookie-banner&lang=ja
http://localhost:3000/?__host=inv2-direct&obstruct=confirm&empty=1
http://localhost:3000/?__host=inv2-direct&obstruct=delayed-modal:3&slow=5
http://localhost:3000/?__host=inv2-direct&obstruct=scroll-lock&multi=3
```

## Appendix C — re-verify every link

```bash
# extract Appendix A and request each link, printing status + URL
awk '/^## Appendix A/,/^## Appendix B/' LINKS.md \
  | grep -oE 'https://inv2-[^ ]+' \
  | while read -r u; do
      printf "%s  %s\n" "$(curl -s -o /dev/null -w '%{http_code}' -m 25 "$u")" "$u"
    done
```
