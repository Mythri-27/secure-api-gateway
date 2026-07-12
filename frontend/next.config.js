/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy /api/* → Express gateway during development
  // In production, set NEXT_PUBLIC_API_URL and handle via env
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
