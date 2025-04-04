/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  eslint: {
    // 在生产构建期间忽略ESLint错误
    ignoreDuringBuilds: true,
  },
  experimental: {
    turbo: {
      rules: {
        '*.svg': ['@svgr/webpack'],
      },
      resolveAlias: {
        // 這裡可以添加自定義別名解析
      },
    },
  },
};

module.exports = nextConfig; 