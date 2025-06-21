/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure base path based on environment variable
  // Only apply basePath when NEXT_PUBLIC_BASE_PATH is explicitly set
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
