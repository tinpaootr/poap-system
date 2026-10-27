import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Bỏ qua thư viện mobile gây lỗi của MetaMask/Wagmi
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },
};

export default nextConfig;