/** @type {import('next').NextConfig} */
const API = process.env.NEXT_PUBLIC_API_URL || "http://backend:8000";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API}/api/:path*` },
      { source: "/tracker/:path*", destination: `${API}/tracker/:path*` },
      { source: "/femantic.js", destination: `${API}/femantic.js` },
    ];
  },
};

module.exports = nextConfig;
