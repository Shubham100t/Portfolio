/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allows a production build while `next dev` keeps its own `.next` locked
  // (Windows denies concurrent writes to the trace file).
  distDir: process.env.NEXT_DIST_DIR || '.next',
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', 'three-stdlib'],
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;