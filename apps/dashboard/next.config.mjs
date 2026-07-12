/* global process */

/** @type {import("next").NextConfig} */
const nextConfig = {
  ...(process.env.NEXT_DIST_DIR === undefined
    ? {}
    : {
        distDir: process.env.NEXT_DIST_DIR
      })
};

export default nextConfig;
