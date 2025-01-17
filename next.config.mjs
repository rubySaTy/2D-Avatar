/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "smartherapy-idle-videos.s3.eu-central-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "2d-avatar-bucket.s3.il-central-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
};

export default nextConfig;
