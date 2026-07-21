/* global process */

/** @type {import("next").NextConfig} */
const nextConfig = {
  ...(process.env.NEXT_DIST_DIR === undefined
    ? {}
    : {
        distDir: process.env.NEXT_DIST_DIR
      }),
  async redirects() {
    return [
      {
        source: "/products/website-builder",
        destination: "/website-builder",
        permanent: true
      },
      {
        source: "/products/online-store",
        destination: "/online-store",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
