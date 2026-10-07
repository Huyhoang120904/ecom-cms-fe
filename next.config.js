/** @type {import('next').NextConfig} */
const isStaticExport = process.env.NEXT_OUTPUT === "export";

const nextConfig = {
  reactStrictMode: true,
  ...(isStaticExport ? { output: "export" } : {}),
  sassOptions: {
    // Bootstrap 5.3's own SCSS uses APIs Dart Sass 3 will remove: `@import`, the global
    // built-ins (map-merge, mix, red/green/blue), the Sass `if()` form, and the colour
    // functions. The theme compiles correctly today, and the warnings are emitted from
    // `node_modules/bootstrap`, not from this project's styles — silencing them keeps a
    // build log readable so a real warning has somewhere to show up. Remove an entry here
    // when the corresponding Bootstrap release stops using it.
    silenceDeprecations: [
      "import",
      "global-builtin",
      "color-functions",
      "if-function",
    ],
  },
  images: {
    // Static hosts cannot run Next's image optimizer. Normal server builds retain
    // optimization; only the explicit GitHub Pages export disables it.
    unoptimized: isStaticExport,
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
