/** @type {import('next').NextConfig} */
const API = process.env.NEXT_PUBLIC_API_URL || "";

const nextConfig = {
  reactStrictMode: true,
  // Empty API = same-origin rewrites off; set NEXT_PUBLIC_API_URL on Railway
  async rewrites() {
    if (!API) return [];
    return [
      { source: "/api/:path*", destination: `${API}/api/:path*` },
      { source: "/tracker/:path*", destination: `${API}/tracker/:path*` },
      { source: "/femantic.js", destination: `${API}/femantic.js` },
    ];
  },
};

module.exports = nextConfig;
