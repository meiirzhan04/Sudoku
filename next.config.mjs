/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co"
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      }
    ]
  },
  async rewrites() {
    return [
      { source: "/api/auth/:path*", destination: `${apiUrl}/api/auth/:path*` },
      { source: "/api/users/:path*", destination: `${apiUrl}/api/users/:path*` },
      { source: "/api/games/:path*", destination: `${apiUrl}/api/games/:path*` },
      { source: "/api/daily/:path*", destination: `${apiUrl}/api/daily/:path*` },
      { source: "/api/stats/:path*", destination: `${apiUrl}/api/stats/:path*` },
      { source: "/api/leaderboard/:path*", destination: `${apiUrl}/api/leaderboard/:path*` },
      { source: "/api/friends/:path*", destination: `${apiUrl}/api/friends/:path*` },
      { source: "/api/multiplayer/:path*", destination: `${apiUrl}/api/multiplayer/:path*` }
    ];
  }
};

export default nextConfig;
