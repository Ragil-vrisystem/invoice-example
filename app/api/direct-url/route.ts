import type { NextRequest } from "next/server";
import { buildPdfEndpointResponse } from "@/lib/pdfResponse";
import { INDEX_FIXTURE_ID } from "@/lib/fixtures";

/**
 * The `inv2-direct-url` host has NO page and NO selector: proxy.ts rewrites
 * every path under that host to this single route, which serves the PDF
 * directly — modeled on an AWS signed-S3 invoice URL. The "signed" query
 * params in real links to this host are purely cosmetic (no verification is
 * performed on them; they exist so a scraped URL looks plausible).
 */
export async function GET(request: NextRequest) {
  const fixtureId = request.headers.get("x-sim-fixture") ?? INDEX_FIXTURE_ID;
  const patternType = request.headers.get("x-sim-pattern-type") ?? "index";

  const response = await buildPdfEndpointResponse({
    searchParams: request.nextUrl.searchParams,
    fixtureId,
    patternType,
  });

  // Cosmetic signed-URL-looking metadata (not verified/enforced).
  response.headers.set("x-sim-cosmetic-signature", "AWS4-HMAC-SHA256-SIMULATED");
  return response;
}
