/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    const backendUrl = process.env.BACKEND_PROXY_URL || "http://localhost:8000";
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${backendUrl}/:path*`,
      },
      {
        source: "/health",
        destination: `${backendUrl}/health`,
      },
      {
        source: "/admin/:path*",
        destination: `${backendUrl}/admin/:path*`,
      },
      {
        source: "/conversations/:path*",
        destination: `${backendUrl}/conversations/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
