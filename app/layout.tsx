import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HSK Studio | เรียนจีนสำหรับผู้เรียนไทย",
  description:
    "เว็บฝึก HSK พร้อมบัตรคำ บทเรียน แบบทดสอบ และแผนอ่านรายวันสำหรับผู้เรียนไทย",
  openGraph: {
    title: "HSK Studio | เรียนจีนสำหรับผู้เรียนไทย",
    description:
      "ฝึก HSK ด้วยบัตรคำ บทเรียน แบบทดสอบ และแผนอ่านรายวัน",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "HSK Studio | เรียนจีนสำหรับผู้เรียนไทย",
    description:
      "ฝึก HSK ด้วยบัตรคำ บทเรียน แบบทดสอบ และแผนอ่านรายวัน",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
