import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HSK Studio | เรียนจีนสำหรับผู้เรียนไทย",
  description:
    "เว็บฝึกภาษาจีนพร้อมบัตรคำ บทเรียน แบบทดสอบ และแผนอ่านรายวันสำหรับผู้เรียนไทย",
  openGraph: {
    title: "HSK Studio | เรียนจีนสำหรับผู้เรียนไทย",
    description:
      "ฝึกภาษาจีนด้วยบัตรคำ บทเรียน แบบทดสอบ และแผนอ่านรายวัน",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "HSK Studio | เรียนจีนสำหรับผู้เรียนไทย",
    description:
      "ฝึกภาษาจีนด้วยบัตรคำ บทเรียน แบบทดสอบ และแผนอ่านรายวัน",
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
      <body>
        {children}
      </body>
    </html>
  );
}
