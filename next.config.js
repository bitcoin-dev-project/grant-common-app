/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Only fix asset paths when served through proxy - don't change app routing
  // This fixes CSS, JS, and _next/static assets when served at /grants
  ...(process.env.NEXT_PUBLIC_ASSET_PREFIX && {
    assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX,
  }),
  // Ensures Tailwind CSS works properly
  experimental: {
    optimizeCss: true
  }
};

module.exports = nextConfig;
