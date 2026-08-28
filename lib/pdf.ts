import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * NTA qualified-invoice ("適格請求書") PDF builder.
 *
 * Fields per the NTA qualified-invoice recipe (no fixed layout is mandated by law, only
 * required content):
 *   - 発行者名 + 登録番号 (T + 13 digits)
 *   - 取引年月日 / 請求期間
 *   - 宛名 ("...御中")
 *   - 請求書番号
 *   - line items: 数量 / 単価 / 金額, split across 10% and 8% tax-rate groups
 *   - 税率別合計 + 税率ごとの消費税額
 *   - 合計金額
 *   - 支払期限
 *   - 振込先 (fictional bank)
 *
 * Text is drawn with a real embedded (subset) Japanese font so the PDF stays
 * pdftotext/pdfplumber-extractable — not rasterized.
 */

const ISSUER_NAME = "株式会社サンプル";
const ISSUER_REGISTRATION_NUMBER = "T1234567890123";
const RECIPIENT_NAME = "Invoice System Test Org";
const BANK_NAME = "架空銀行";
const BANK_BRANCH = "本店営業部";
const BANK_ACCOUNT_TYPE = "普通";
const BANK_ACCOUNT_NUMBER = "1234567";
const BANK_ACCOUNT_HOLDER = "カ）サンプル";

export interface InvoiceLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: 10 | 8;
}

export interface InvoicePdfOptions {
  /** YYYYMM, defaults to current month */
  yearMonth?: string;
  /** Invoice sequence number (varies the invoice number / totals slightly), defaults to 1 */
  n?: number;
}

function yen(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}

function defaultLineItems(n: number): InvoiceLineItem[] {
  // Vary quantities/prices slightly by `n` so ?n=2 etc produces a genuinely different invoice.
  const base = 10000 + (n - 1) * 1500;
  return [
    { name: "コンサルティング業務（標準税率対象）", quantity: 1, unitPrice: base, taxRate: 10 },
    { name: "システム保守作業（標準税率対象）", quantity: 2, unitPrice: base / 2, taxRate: 10 },
    { name: "軽減税率対象商品（食品等）", quantity: 3, unitPrice: 800 + (n - 1) * 50, taxRate: 8 },
  ];
}

function invoiceNumber(yearMonth: string, n: number): string {
  const nnnnn = String(n).padStart(5, "0");
  return `INV2-${yearMonth}-${nnnnn}`;
}

function currentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

function formatYearMonthJa(yearMonth: string): string {
  const y = yearMonth.slice(0, 4);
  const m = yearMonth.slice(4, 6);
  return `${y}年${m}月`;
}

async function loadFontBytes(): Promise<Uint8Array> {
  const fontPath = path.join(process.cwd(), "assets", "fonts", "MPLUS1p-Regular.ttf");
  const buf = await readFile(fontPath);
  return new Uint8Array(buf);
}

export async function buildInvoicePdf(options: InvoicePdfOptions = {}): Promise<Uint8Array> {
  const yearMonth = options.yearMonth ?? currentYearMonth();
  const n = options.n ?? 1;

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const fontBytes = await loadFontBytes();
  const font: PDFFont = await doc.embedFont(fontBytes, { subset: true });

  const page: PDFPage = doc.addPage([595.28, 841.89]); // A4 portrait, points
  const margin = 50;
  let y = 841.89 - margin;

  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const lineGray = rgb(0.75, 0.75, 0.75);

  const draw = (text: string, x: number, yPos: number, size = 10, color = black) => {
    page.drawText(text, { x, y: yPos, size, font, color });
  };

  const invNo = invoiceNumber(yearMonth, n);

  // Title
  draw("請求書", margin, y, 24);
  draw("（適格請求書）", margin + 90, y + 4, 11, gray);
  y -= 34;

  // Invoice number + issue date, right-aligned block at top
  const topRightX = 595.28 - margin - 200;
  draw(`請求書番号：${invNo}`, topRightX, y, 10);
  y -= 14;
  const issueDate = `${yearMonth.slice(0, 4)}年${yearMonth.slice(4, 6)}月末日`;
  draw(`発行日：${issueDate}`, topRightX, y, 10);
  y -= 14;
  draw(`請求期間：${formatYearMonthJa(yearMonth)}分`, topRightX, y, 10);
  y -= 30;

  // Recipient
  draw(`${RECIPIENT_NAME} 御中`, margin, y, 14);
  y -= 26;

  // Issuer block
  draw("発行者：" + ISSUER_NAME, margin, y, 11);
  y -= 15;
  draw("登録番号：" + ISSUER_REGISTRATION_NUMBER, margin, y, 11);
  y -= 15;
  draw("東京都千代田区サンプル1-2-3", margin, y, 10, gray);
  y -= 26;

  // Line items table header
  const colX = { name: margin, qty: 300, unit: 360, taxRate: 440, amount: 490 };
  draw("品目", colX.name, y, 10, gray);
  draw("数量", colX.qty, y, 10, gray);
  draw("単価", colX.unit, y, 10, gray);
  draw("税率", colX.taxRate, y, 10, gray);
  draw("金額", colX.amount, y, 10, gray);
  y -= 6;
  page.drawLine({
    start: { x: margin, y },
    end: { x: 595.28 - margin, y },
    thickness: 1,
    color: lineGray,
  });
  y -= 16;

  const items = defaultLineItems(n);
  const groupSubtotal: Record<10 | 8, number> = { 10: 0, 8: 0 };

  for (const item of items) {
    const amount = Math.round(item.quantity * item.unitPrice);
    groupSubtotal[item.taxRate] += amount;

    draw(item.name, colX.name, y, 9.5);
    draw(String(item.quantity), colX.qty, y, 9.5);
    draw(yen(Math.round(item.unitPrice)), colX.unit, y, 9.5);
    draw(`${item.taxRate}%`, colX.taxRate, y, 9.5);
    draw(yen(amount), colX.amount, y, 9.5);
    y -= 18;
  }

  y -= 6;
  page.drawLine({
    start: { x: margin, y },
    end: { x: 595.28 - margin, y },
    thickness: 1,
    color: lineGray,
  });
  y -= 20;

  // 税率別合計 + 消費税額
  const tax10 = Math.round(groupSubtotal[10] * 0.1);
  const tax8 = Math.round(groupSubtotal[8] * 0.08);
  const totalExTax = groupSubtotal[10] + groupSubtotal[8];
  const totalTax = tax10 + tax8;
  const grandTotal = totalExTax + totalTax;

  draw("税率別合計", margin, y, 11);
  y -= 16;
  if (groupSubtotal[10] > 0) {
    draw(`10%対象：${yen(groupSubtotal[10])}　消費税額：${yen(tax10)}`, margin + 10, y, 10);
    y -= 15;
  }
  if (groupSubtotal[8] > 0) {
    draw(`8%対象（軽減税率）：${yen(groupSubtotal[8])}　消費税額：${yen(tax8)}`, margin + 10, y, 10);
    y -= 15;
  }
  y -= 6;

  draw(`合計金額（税込）：${yen(grandTotal)}`, margin, y, 13);
  y -= 30;

  // Payment terms
  const dueDate = `${yearMonth.slice(0, 4)}年${String(Number(yearMonth.slice(4, 6)) + 1).padStart(2, "0")}月末日`;
  draw(`支払期限：${dueDate}`, margin, y, 10);
  y -= 24;

  // Bank details
  draw("振込先", margin, y, 11);
  y -= 16;
  draw(`${BANK_NAME}　${BANK_BRANCH}　${BANK_ACCOUNT_TYPE}　${BANK_ACCOUNT_NUMBER}`, margin + 10, y, 10);
  y -= 15;
  draw(`口座名義：${BANK_ACCOUNT_HOLDER}`, margin + 10, y, 10);
  y -= 30;

  draw(
    "※本書類はテスト用の架空請求書です。実在の取引を証明するものではありません。",
    margin,
    40,
    8,
    gray,
  );

  const pdfBytes = await doc.save();
  return pdfBytes;
}

export function invoicePdfFilename(yearMonth?: string): string {
  const ym = yearMonth ?? currentYearMonth();
  return `請求書_${ym}_${ISSUER_NAME}.pdf`;
}

export const INVOICE_ISSUER_NAME = ISSUER_NAME;
export const INVOICE_ISSUER_REGISTRATION_NUMBER = ISSUER_REGISTRATION_NUMBER;
export const INVOICE_RECIPIENT_NAME = RECIPIENT_NAME;
