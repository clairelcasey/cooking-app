import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'thebigmansworld.com',
      },
      {
        protocol: 'https',
        hostname: 'www.themediterraneandish.com',
      },
    ],
  },
};

export default nextConfig;
