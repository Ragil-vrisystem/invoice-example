import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The PDF builder reads the vendored font at request time via
  // fs.readFile(process.cwd()/assets/fonts/...), which Vercel's file tracing
  // can't always infer — include it explicitly so deployed functions have it.
  outputFileTracingIncludes: {
    "/**": ["./assets/fonts/**"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
