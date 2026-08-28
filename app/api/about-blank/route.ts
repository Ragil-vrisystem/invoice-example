import { NextResponse, type NextRequest } from "next/server";
import { INDEX_FIXTURE_ID } from "@/lib/fixtures";

/**
 * `inv2-about-blank` trap host: proxy.ts rewrites every path under this host
 * here. The page meta-refreshes AND JS-redirects to `about:blank` — modeled
 * on the v1 "regression 13a" junk-domain guard fixture. An automation under
 * test must never register this host as a platform, even on a success path.
 */
export async function GET(request: NextRequest) {
  const fixtureId = request.headers.get("x-sim-fixture") ?? INDEX_FIXTURE_ID;
  const patternType = request.headers.get("x-sim-pattern-type") ?? "trap";

  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=about:blank">
<title>Redirecting...</title>
</head>
<body>
<p>about:blank へ転送しています…</p>
<script>
  window.location.replace("about:blank");
</script>
</body>
</html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
  response.headers.set("x-sim-fixture", fixtureId);
  response.headers.set("x-sim-pattern-type", patternType);
  return response;
}
