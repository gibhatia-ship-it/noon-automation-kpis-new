/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=10800, stale-while-revalidate=600' },
        ],
      },
    ];
  },
};

export default nextConfig;
