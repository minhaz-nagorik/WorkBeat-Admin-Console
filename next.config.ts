import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets `next dev` serve test custom domains such as acme.localhost:3001 (custom-domain, local testing).
  allowedDevOrigins: ['*.localhost'],
};

export default nextConfig;
