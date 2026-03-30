/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Questo ignora gli errori di TypeScript durante il caricamento
    ignoreBuildErrors: true,
  },
  eslint: {
    // Questo ignora i suggerimenti di stile
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;