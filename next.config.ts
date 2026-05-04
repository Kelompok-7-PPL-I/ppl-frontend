// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "dksuiswxqpvscdhpccbk.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "wiratech.co.id" },
      { protocol: "https", hostname: "picsum.photos" }, // <== tambah ini
    ],
  },
};

export default nextConfig;