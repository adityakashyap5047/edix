import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        pathname: "/adityakashyap5047/vividly/**",
      },
    ],
  },
};

export default nextConfig;
