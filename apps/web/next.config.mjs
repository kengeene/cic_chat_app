import { fileURLToPath } from 'node:url';

const monorepoRoot = fileURLToPath(new URL('../..', import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: monorepoRoot,
  // Self-contained server bundle for the Docker image (ignored by `next dev`).
  output: 'standalone',
};

export default nextConfig;
