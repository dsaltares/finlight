/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  pageExtensions: ['page.ts', 'page.tsx', 'next.tsx', 'route.ts'],
  eslint: {
    dirs: ['src'],
  },
};

module.exports = withPWA(nextConfig);
