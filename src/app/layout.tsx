import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { HeaderNav } from '@/components/layout/HeaderNav';
import { BottomNav } from '@/components/layout/BottomNav';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import './globals.css';

export const metadata: Metadata = {
  title: 'Storlit — 매일 함께 쓰는 릴레이 소설',
  description:
    '매일 한 편의 단편이 집단 창작으로 완성되는 참여형 릴레이 소설 플랫폼',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          {/* Desktop: top header nav */}
          <HeaderNav />

          {/* Mobile: simple top bar with logo + theme toggle */}
          <header className="flex items-center justify-between px-4 h-12 border-b border-border bg-bg-surface md:hidden">
            <span className="text-lg font-bold text-text-primary">Storlit</span>
            <ThemeToggle />
          </header>

          {/* Content area */}
          <main className="max-w-[640px] mx-auto px-4 py-6 pb-20 md:pb-6">
            {children}
          </main>

          {/* Mobile: bottom tab nav */}
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
