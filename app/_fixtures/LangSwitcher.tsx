import type { SP } from "@/lib/searchParams";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

/**
 * EN / 日本語 toggle. A plain relative `?...` link (no pathname) so it stays
 * on the current page; proxy.ts persists the choice into a `sim_lang` cookie
 * so it sticks across navigation without repeating `?lang=` everywhere.
 */

function buildQuery(sp: SP, lang: Lang): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key === "lang" || value === undefined) continue;
    const v = Array.isArray(value) ? value[0] : value;
    if (v !== undefined) params.set(key, v);
  }
  params.set("lang", lang);
  return `?${params.toString()}`;
}

interface Props {
  searchParams: SP;
  lang: Lang;
}

export default function LangSwitcher({ searchParams, lang }: Props) {
  const dict = t(lang);
  const linkStyle = (active: boolean) => ({
    fontWeight: active ? 700 : 400,
    color: active ? "#2857c8" : "#888",
    textDecoration: active ? "none" : "underline",
  });

  return (
    <div style={{ fontSize: 12, marginBottom: 12, display: "flex", gap: 8 }}>
      <a href={buildQuery(searchParams, "en")} style={linkStyle(lang === "en")}>
        {dict.common.langEn}
      </a>
      <span style={{ color: "#ccc" }}>|</span>
      <a href={buildQuery(searchParams, "ja")} style={linkStyle(lang === "ja")}>
        {dict.common.langJa}
      </a>
    </div>
  );
}
