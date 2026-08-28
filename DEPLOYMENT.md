# Deployment (Vercel)

How the 8 fixture hosts are wired on Vercel. Companion to `README.md` — that file
describes what each pattern *does*, this one describes how it is *reachable*.

| | |
|---|---|
| Team | `hamasmart` (account `ragil-6291`) |
| Project | `invoice-example` — `prj_vZrmP1ihW4w4P0pXt3IB9tJdcuPo` |
| Framework preset | Next.js, Node 24.x, region `iad1` |
| Production deployment | `dpl_9ULZ6ySryfNEe8JbzmfzevnFKRbB` (built 2026-08-27) |

## Pattern type → subdomain

Every pattern type has its own subdomain, so an automation can detect the platform shape
from the hostname alone. `proxy.ts` resolves the fixture from the `Host` header and stamps
`x-sim-fixture` / `x-sim-pattern-type` on **every** response; `lib/fixtures.ts` is the
registry these map to.

| Subdomain | `x-sim-pattern-type` | Shape |
|---|---|---|
| `inv2-direct.vercel.app` | `direct` | Tokenized URL → preview page + download button |
| `inv2-direct-url.vercel.app` | `direct_url` | The URL *is* the download; every path serves the PDF |
| `inv2-email-gated.vercel.app` | `email_gated` | Email-address gate before download |
| `inv2-login.vercel.app` | `login` | Username + password |
| `inv2-login-pw.vercel.app` | `login_password_only` | Password only |
| `inv2-email-otp.vercel.app` | `email_password` | Email + emailed code, code field present on load |
| `inv2-email-otp-trigger.vercel.app` | `email_password_triggered` | Same, but code field appears only after `#send-code` |
| `inv2-about-blank.vercel.app` | `trap` | `about:blank` redirect trap — never register this one |

Plus `invoice-example-liard.vercel.app` — the fixture index page. Fixtures are also
reachable from it via `?__host=inv2-<name>`.

Note: `invoice-example.vercel.app` (no suffix) is an unrelated third-party site.

## How the subdomains are wired

The 8 hosts are registered as **project domains**, not as deployment aliases. This matters
for two reasons:

1. **They follow production.** A project domain is reassigned to the newest production
   deployment automatically. A `vercel alias set` binding pins to one specific deployment,
   so after the next `vercel deploy --prod` every pattern host would keep serving the *old*
   build until someone re-ran the alias loop by hand. Do not re-introduce that loop.
2. **They are exempt from Deployment Protection.** The project keeps
   `ssoProtection: all_except_custom_domains`, under which only domains registered on the
   project answer anonymously. Raw deployment URLs and preview builds stay behind Vercel
   SSO, which is the desired split: the fixtures are public, the build URLs are not.

To register a host (idempotent — re-adding an existing one is a no-op error):

```bash
vercel domains add inv2-<name>.vercel.app invoice-example --scope hamasmart
```

Verified 2026-08-28: all 8 return `200` anonymously with the correct
`x-sim-fixture` / `x-sim-pattern-type`, while
`invoice-example-o8j2gk8y3-hamasmart.vercel.app` and
`invoice-example-hamasmart.vercel.app` still `302` to SSO.

## Verifying after a deploy

```bash
# every pattern host: expect 200 + matching headers
for h in inv2-direct inv2-direct-url inv2-email-gated inv2-login \
         inv2-login-pw inv2-email-otp inv2-email-otp-trigger inv2-about-blank; do
  printf "%-24s %s\n" "$h" \
    "$(curl -s -o /dev/null -D - "https://$h.vercel.app" | grep -i '^x-sim-pattern-type')"
done

# the two "no page" hosts behave correctly
curl -s https://inv2-direct-url.vercel.app/any/path | head -c 5   # => %PDF-
curl -s https://inv2-about-blank.vercel.app/ | grep about:blank   # => the trap
```

A `302` to `vercel.com/sso-api` means that host lost its project-domain registration —
re-add it with the command above rather than reaching for `vercel alias set`.

## Known gaps

- **No Git integration.** The Vercel project has no repository connected (`link: null`);
  the live build was a CLI deploy from a working tree. Pushing to
  `github.com/Ragil-vrisystem/invoice-example` deploys nothing, and there are no per-branch
  preview deployments. Run `vercel git connect` to change that.
- **Live build predates the repo.** The production deployment was built before this project
  was put under version control, so "what is deployed" is not provably `HEAD`. The next
  `vercel deploy --prod` resolves this — and also confirms the project domains hand over to
  the new deployment as described above.
