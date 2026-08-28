import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { DEFAULT_LANG, isLang } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Invoice Platform Example",
  description: "A test fixture suite simulating Japanese invoice-delivery platform patterns.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const hdrs = await headers();
  const langHeader = hdrs.get("x-sim-lang");
  const lang = isLang(langHeader) ? langHeader : DEFAULT_LANG;

  return (
    <html lang={lang}>
      <body
        style={{
          margin: 0,
          fontFamily:
            '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif',
          background: "#f5f6f8",
          color: "#1c1e21",
        }}
      >
        {children}
      </body>
    </html>
  );
}
