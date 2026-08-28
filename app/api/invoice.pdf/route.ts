import type { NextRequest } from "next/server";
import { buildPdfEndpointResponse } from "@/lib/pdfResponse";
import { INDEX_FIXTURE_ID } from "@/lib/fixtures";

/**
 * Public PDF endpoint used by the `direct` host (and referenced directly by
 * curl/automation tests). Fixture id / pattern type are read from the request
 * headers stamped by proxy.ts.
 */
export async function GET(request: NextRequest) {
  const fixtureId = request.headers.get("x-sim-fixture") ?? INDEX_FIXTURE_ID;
  const patternType = request.headers.get("x-sim-pattern-type") ?? "index";

  return buildPdfEndpointResponse({
    searchParams: request.nextUrl.searchParams,
    fixtureId,
    patternType,
  });
}
