"use client";

import Navbar from "../components/landing/Navbar";
import Hero3D from "../components/landing/Hero3D";
import FeaturesSection from "../components/landing/FeaturesSection";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-900 overflow-x-hidden selection:bg-teal-500/30">
      <Navbar />
      
      {/* Hero Section Container */}
      <section className="relative w-full h-screen flex flex-col items-center justify-center pt-20">
        <Hero3D />
        
        {/* Hero Content overlay */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pointer-events-none">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-lg">
            เรียนภาษาจีนให้ถึง <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">HSK</span> อย่างมั่นใจ
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto drop-shadow-md">
            คำศัพท์ครบทุกระดับ บทเรียนเป็นขั้นตอน และข้อสอบจำลองรูปแบบเดียวกับสนามจริง ออกแบบมาสำหรับผู้เรียนไทยโดยเฉพาะ
          </p>
          <div className="pointer-events-auto flex gap-4 justify-center">
            <a 
              href="#features" 
              className="px-8 py-3 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold transition-all shadow-lg hover:shadow-teal-500/25"
            >
              ดูฟีเจอร์
            </a>
            <a 
              href="/" 
              className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition-all backdrop-blur-md border border-white/10"
            >
              เข้าสู่แอป
            </a>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/50 z-10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M19 12l-7 7-7-7"/>
          </svg>
        </div>
      </section>

      <FeaturesSection />

      {/* About/CTA Section */}
      <section id="about" className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 backdrop-blur-xl">
          <h2 className="text-3xl font-bold text-white mb-6">พร้อมเริ่มเรียนภาษาจีนแล้วหรือยัง?</h2>
          <p className="text-gray-300 mb-8 max-w-xl mx-auto">
            เริ่มจากคำศัพท์ HSK 1 วันละไม่กี่คำ แล้วทดสอบตัวเองด้วยข้อสอบจำลองเมื่อพร้อม
          </p>
          <a href="/vocabulary" className="inline-block px-8 py-3 rounded-full bg-white text-slate-900 font-bold hover:scale-105 transition-transform">
            เริ่มเรียนเลย
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/10 text-center text-gray-400 text-sm">
        <p>© 2026 HSK Systems. All rights reserved.</p>
      </footer>
    </main>
  );
}
