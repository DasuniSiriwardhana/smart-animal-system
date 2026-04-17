import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Add security headers to allow Spline iframes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://my.spline.design https://*.spline.design;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;