import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sentinel/database", "@sentinel/shared"],
  eslint: {
    // Next.js auto-lint can fail in CI (strict mode, missing .next types on first run)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
