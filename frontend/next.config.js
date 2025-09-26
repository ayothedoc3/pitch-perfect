const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  },

  images: {
    domains: ['localhost', 'api.pitchbuddy.online'],
  },

  outputFileTracingRoot: path.join(__dirname, '..'),

  webpack: (config, { dev }) => {
    config.module.rules.push({
      test: /\.(mp3|wav|webm|mp4)$/,
      type: 'asset/resource',
    });

    if (dev) {
      config.cache = false;
    }

    return config;
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.INTERNAL_API_URL || 'http://127.0.0.1:3011/api/:path*',
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
