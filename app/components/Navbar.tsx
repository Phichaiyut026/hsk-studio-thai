"use client";

import Link from "next/link";
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
    { href: "/vocabulary", label: "บัตรคำ & คลังศัพท์" },
    { href: "/lessons", label: "บทเรียน & ไวยากรณ์" },
    { href: "/quiz", label: "แบบทดสอบ" },
    { href: "/plan", label: "แผนเรียน & จับเวลา" },
    { href: "/stats", label: "สถิติ & ความคืบหน้า" },
    { href: "/admin", label: "Dashboard" },
  ];

  return (
    <header className="site-navbar">
      <div className="site-navbar-inner">
        <div className="site-navbar-row">
          {/* Brand Logo */}
          <Link href="/" className="site-navbar-brand">
            <span className="site-navbar-mark">
              汉
            </span>
            <span className="site-navbar-brand-copy">
              <span className="site-navbar-title">
                HSK Studio
              </span>
              <span className="site-navbar-subtitle">
                เรียนจีนสำหรับคนไทย
              </span>
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="site-navbar-menu">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  target={item.href === "/admin" ? "_blank" : undefined}
                  rel={item.href === "/admin" ? "noreferrer" : undefined}
                  className={`site-navbar-item ${isActive ? "is-active" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Account / Actions */}
          <div className="site-navbar-account">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="site-navbar-user">
                  {user.displayName}
                </span>
                {authPaths?.signOut && (
                  <a
                    href={authPaths.signOut}
                    className="site-navbar-auth"
                  >
                    ออกจากระบบ
                  </a>
                )}
              </div>
            ) : authPaths?.signIn ? (
              <a
                href={authPaths.signIn}
                className="site-navbar-login"
              >
                เข้าสู่ระบบ
              </a>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="site-navbar-menu-button"
            aria-label="เปิดเมนู"
          >
            {mobileMenuOpen ? "ปิดเมนู" : "เมนู"}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="site-navbar-mobile">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                target={item.href === "/admin" ? "_blank" : undefined}
                rel={item.href === "/admin" ? "noreferrer" : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={`site-navbar-mobile-item ${isActive ? "is-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="site-navbar-mobile-account">
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
