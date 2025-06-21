/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensures Tailwind CSS works properly
  experimental: {
    optimizeCss: true
  }
};

// Only add basePath and assetPrefix when explicitly configured for subpath deployment
if (process.env.NEXT_PUBLIC_BASE_PATH && process.env.NEXT_PUBLIC_BASE_PATH.trim() !== '') {
  nextConfig.basePath = process.env.NEXT_PUBLIC_BASE_PATH;
  nextConfig.assetPrefix = process.env.NEXT_PUBLIC_BASE_PATH;
}

module.exports = nextConfig;
