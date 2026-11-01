import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Bỏ qua thư viện mobile gây lỗi của MetaMask/Wagmi
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    };

    // THÊM MỚI: Ẩn cảnh báo Critical dependency từ thư viện ox / viem
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []), // Giữ lại các cảnh báo đã bị ẩn trước đó (nếu có)
      { module: /node_modules\/ox/ }
    ];

    return config;
  },
};

export default nextConfig;