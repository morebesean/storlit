'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { href: '/', label: '홈' },
  { href: '/archive', label: '아카이브' },
  { href: '/profile', label: '프로필' },
];

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <header className="hidden md:block sticky top-0 z-50 border-b border-border bg-bg-surface">
      <div className="max-w-screen-lg mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-text-primary">
          Storlit
        </Link>
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-4">
            {navItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-accent'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
