"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

type NavbarProps = {
  authPaths?: {
    signIn: string;
    signOut: string;
  };
  user?: {
    displayName: string;
    email: string;
  } | null;
};

export default function Navbar({ authPaths, user }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "หน้าแรก" },
    { href: "/vocabulary", label: "คำศัพท์" },
    { href: "/lessons", label: "บทเรียน" },
    { href: "/quiz", label: "แบบทดสอบ" },
    { href: "/plan", label: "แผนเรียน" },
    { href: "/stats", label: "สถิติ" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--paper)]/90 backdrop-blur-md border-b border-[var(--line)] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <span className="w-10 h-10 rounded-lg bg-[var(--ink)] text-[var(--paper)] flex items-center justify-center font-bold text-xl shadow-xs group-hover:scale-105 transition-transform">
              汉
            </span>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-[var(--ink)] leading-none">
                HSK Studio
              </span>
              <span className="text-[10px] font-semibold text-[var(--muted)] tracking-wider uppercase">
                เรียนจีนสำหรับคนไทย
              </span>
            </div>
          </a>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-[var(--ink)] text-white shadow-xs"
                      : "text-[var(--ink)] hover:bg-black/5 hover:text-black"
                  }`}
                >
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Account / Actions */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 text-xs font-bold text-[var(--ink)] bg-black/5 border border-[var(--line)] rounded-lg truncate max-w-[160px]">
                  👤 {user.displayName}
                </span>
                {authPaths?.signOut && (
                  <a
                    href={authPaths.signOut}
                    className="px-3 py-1.5 text-xs font-bold text-[var(--red)] hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-all"
                  >
                    ออกจากระบบ
                  </a>
                )}
              </div>
            ) : authPaths?.signIn ? (
              <a
                href={authPaths.signIn}
                className="px-4 py-2 text-xs font-bold text-white bg-[var(--red)] hover:opacity-90 rounded-lg transition-all shadow-xs"
              >
                เข้าสู่ระบบ
              </a>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[var(--ink)] hover:bg-black/5"
            aria-label="เปิดเมนู"
          >
            {mobileMenuOpen ? "ปิด" : "เมนู"}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--line)] bg-[var(--paper)] px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold ${
                  isActive
                    ? "bg-[var(--ink)] text-white"
                    : "text-[var(--ink)] hover:bg-black/5"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            );
          })}
          <div className="pt-3 mt-2 border-t border-[var(--line)]">
            {user ? (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--muted)]">
                  {user.displayName}
                </span>
                {authPaths?.signOut && (
                  <a
                    href={authPaths.signOut}
                    className="text-xs font-bold text-[var(--red)]"
                  >
                    ออกจากระบบ
                  </a>
                )}
              </div>
            ) : authPaths?.signIn ? (
              <a
                href={authPaths.signIn}
                className="block text-center py-2 text-xs font-bold text-white bg-[var(--red)] rounded-lg"
              >
                เข้าสู่ระบบ
              </a>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
