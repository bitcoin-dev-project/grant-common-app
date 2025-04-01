/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensures Tailwind CSS works properly
  experimental: {
    optimizeCss: true
  }
};

module.exports = nextConfig;
