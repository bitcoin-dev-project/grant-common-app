/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure both routing and assets when served through proxy
  // This fixes both navigation links AND static assets when served at /grants
  ...(process.env.NEXT_PUBLIC_BASE_PATH && {
    basePath: process.env.NEXT_PUBLIC_BASE_PATH,
    assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH,
  }),
  // Ensures Tailwind CSS works properly
  experimental: {
    optimizeCss: true
  }
};

module.exports = nextConfig;
