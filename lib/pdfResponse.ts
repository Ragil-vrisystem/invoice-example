import { NextResponse } from "next/server";
import { buildInvoicePdf, invoicePdfFilename } from "./pdf";

/**
 * Shared failure-mode query-param handling for every PDF-serving endpoint
 * (invoice.pdf, direct-url, sim/download).
 *
 * Composable params:
 *   ?empty=1      -> 204 No Content
 *   ?http500=1    -> 500 Internal Server Error
 *   ?htmlfile=1   -> 200 text/html, but with a .pdf-ish Content-Disposition filename
 *   ?jsonerr=1    -> 200 application/json {"error": "..."}
 *   ?slow=S       -> delay S seconds (clamped to 120) before responding
 *   ?n=K          -> vary invoice number/content by K (defaults to 1)
 *   ?ym=YYYYMM    -> explicit year-month (defaults to current month)
 */

const MAX_SLOW_SECONDS = 120;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rfc5987Filename(filename: string): string {
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="invoice.pdf"; filename*=UTF-8''${encoded}`;
}

export interface PdfResponseParams {
  searchParams: URLSearchParams;
  fixtureId: string;
  patternType: string;
}

export async function buildPdfEndpointResponse({
  searchParams,
  fixtureId,
  patternType,
}: PdfResponseParams): Promise<NextResponse> {
  const slowParam = searchParams.get("slow");
  if (slowParam) {
    const seconds = Math.min(Math.max(Number(slowParam) || 0, 0), MAX_SLOW_SECONDS);
    if (seconds > 0) {
      await sleep(seconds * 1000);
    }
  }

  const withSimHeaders = (res: NextResponse): NextResponse => {
    res.headers.set("x-sim-fixture", fixtureId);
    res.headers.set("x-sim-pattern-type", patternType);
    return res;
  };

  if (searchParams.get("empty") === "1") {
    return withSimHeaders(new NextResponse(null, { status: 204 }));
  }

  if (searchParams.get("http500") === "1") {
    return withSimHeaders(
      NextResponse.json({ error: "internal_server_error" }, { status: 500 }),
    );
  }

  const ym = searchParams.get("ym") ?? undefined;
  const nParam = searchParams.get("n");
  const n = nParam ? Math.max(1, Number(nParam) || 1) : 1;

  if (searchParams.get("htmlfile") === "1") {
    const filename = invoicePdfFilename(ym);
    const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>${filename}</title></head><body><p>これはPDFではなくHTMLページです（artifact-validation フィクスチャ用）。</p></body></html>`;
    const res = new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": rfc5987Filename(filename),
      },
    });
    return withSimHeaders(res);
  }

  if (searchParams.get("jsonerr") === "1") {
    return withSimHeaders(
      NextResponse.json({ error: "download_failed", reason: "simulated_json_error" }, { status: 200 }),
    );
  }

  const pdfBytes = await buildInvoicePdf({ yearMonth: ym, n });
  const filename = invoicePdfFilename(ym);

  const res = new NextResponse(new Uint8Array(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": rfc5987Filename(filename),
      "Content-Length": String(pdfBytes.byteLength),
    },
  });
  return withSimHeaders(res);
}
