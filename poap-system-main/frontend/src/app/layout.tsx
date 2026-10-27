import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Navbar from '@/components/share/Navbar'; // Đổi đường dẫn này nếu Navbar của bạn nằm ở thư mục khác (vd: '@/components/share/Navbar')

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hệ thống POAP - Chứng nhận Sự kiện',
  description: 'Điểm danh và nhận NFT chứng nhận sự kiện câu lạc bộ',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}