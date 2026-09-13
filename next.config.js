/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The application source lives under `src/`, the Next.js default location.
  experimental: {},
  images: {
    // Media is served by ecom-be at a derived, digest-versioned URL. The origin the
    // API reports is read from NEXT_PUBLIC_API_URL, so a deployment that moves the
    // API also moves this allow-list rather than silently breaking avatars.
    remotePatterns: [
      {
        protocol: process.env.NEXT_PUBLIC_API_URL?.startsWith("https") ? "https" : "http",
        hostname: process.env.NEXT_PUBLIC_API_HOSTNAME ?? "localhost",
        port: process.env.NEXT_PUBLIC_API_PORT ?? "8000",
        pathname: "/api/v1/media/**",
      },
    ],
  },
};

module.exports = nextConfig;
