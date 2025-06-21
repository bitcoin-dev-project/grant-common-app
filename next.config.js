/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure assetPrefix for static assets when served through proxy
  // This ensures CSS, JS, and images load correctly at bitcoindevs.xyz/grants
  ...(process.env.NEXT_PUBLIC_ASSET_PREFIX && {
    assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX,
  }),
  // Ensures Tailwind CSS works properly
  experimental: {
    optimizeCss: true
  }
};

module.exports = nextConfig;
