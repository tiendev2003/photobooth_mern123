import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["canvas-confetti"], // Moved from experimental.serverComponentsExternalPackages

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    largePageDataBytes: 128 * 1000 * 1000, // 128 MB
  },
};

export default nextConfig;
