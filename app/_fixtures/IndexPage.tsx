import type { CSSProperties } from "react";
import { FIXTURES } from "@/lib/fixtures";
import { t, type Lang } from "@/lib/i18n";
import type { SP } from "@/lib/searchParams";
import LangSwitcher from "./LangSwitcher";

const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e4e8",
  borderRadius: 8,
  padding: "16px 20px",
  marginBottom: 12,
};

const codeStyle: CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  background: "#eef0f3",
  padding: "1px 6px",
  borderRadius: 4,
  fontSize: 13,
};

const credentialsHintStyle: CSSProperties = {
  fontSize: 13,
  color: "#1e3a6e",
  background: "#eef4ff",
  border: "1px dashed #7ea3e0",
  borderRadius: 6,
  padding: "6px 10px",
  marginTop: 8,
};

interface Props {
  lang: Lang;
  searchParams: SP;
}

export default function IndexPage({ lang, searchParams }: Props) {
  const dict = t(lang);

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 20px" }}>
      <LangSwitcher searchParams={searchParams} lang={lang} />
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>{dict.index.title}</h1>
      <p style={{ color: "#555", marginTop: 0 }}>{dict.index.intro}</p>

      <h2 style={{ fontSize: 16, marginTop: 32, marginBottom: 8 }}>{dict.index.fixturesHeading}</h2>
      {FIXTURES.map((f) => (
        <div key={f.id} style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <a href={`/?__host=${f.id}`} style={{ fontWeight: 600, fontSize: 15 }}>
              {f.id}
            </a>
            <span style={codeStyle}>{f.patternType}</span>
          </div>
          <div style={{ fontSize: 14, marginTop: 4 }}>{f.label[lang]}</div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{f.description[lang]}</div>
          <div style={credentialsHintStyle}>
            <strong>{dict.index.inputInfoLabel}</strong>
            {f.credentialsHint[lang]}
          </div>
        </div>
      ))}

      <h2 style={{ fontSize: 16, marginTop: 32, marginBottom: 8 }}>{dict.index.localTestHeading}</h2>
      <ul style={{ fontSize: 14, lineHeight: 1.8, color: "#333" }}>
        <li>{dict.index.browserHint}</li>
        <li>
          {dict.index.curlHint}{" "}
          <span style={codeStyle}>curl -H &quot;Host: inv2-direct&quot; http://localhost:3000/</span>
        </li>
        <li>{dict.index.headerHint}</li>
      </ul>
    </main>
  );
}
