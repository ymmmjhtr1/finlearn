/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // yahoo-finance2는 번들링하지 않고 Node 런타임에서 그대로 불러온다.
    serverComponentsExternalPackages: ["yahoo-finance2"],
  },
};

export default nextConfig;
