import type { NextConfig } from "next";

const pages = [
  "next.config.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
  ".lintstagedrc.mjs",
];
const dirs = ["app", "lib", "utils"];

const nextConfig: NextConfig = {
  eslint: {
    dirs: [...pages, ...dirs],
  },
};

export default nextConfig;
