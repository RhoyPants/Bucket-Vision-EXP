import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        destination: "https://vision.globalvisionsinc.com.ph",
        permanent: false,
      },
    ];
  },

  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias.canvas = false;

    return config;
  },
};

export default nextConfig;
