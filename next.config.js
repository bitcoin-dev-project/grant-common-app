/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure base path based on environment
  // When deployed standalone, no basePath needed
  // When served through main site, use /grants basePath
  basePath: process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_BASE_PATH ? process.env.NEXT_PUBLIC_BASE_PATH : '',
  assetPrefix: process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_BASE_PATH ? process.env.NEXT_PUBLIC_BASE_PATH : '',
  // Ensures Tailwind CSS works properly
  experimental: {
    optimizeCss: true
  }
};

module.exports = nextConfig;
