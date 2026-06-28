import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: process.cwd(),
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
