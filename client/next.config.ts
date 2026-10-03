import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Do not advertise the framework in response headers.
  poweredByHeader: false,
};

export default nextConfig;
