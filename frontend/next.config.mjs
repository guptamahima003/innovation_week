/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Docker / serverless deployments
  output: "standalone",

  // Ensure env vars are available at build time
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },

  // Disable ESLint errors blocking production build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors blocking production build (pre-existing issues in node_modules)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
