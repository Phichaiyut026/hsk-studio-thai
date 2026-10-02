"use client";

import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-md border-b border-white/10 z-[-1]" />
      
      <div className="text-white font-bold text-xl tracking-wider">
        HSK <span className="text-teal-400">Systems</span>
      </div>

      {/* Desktop Nav */}
      <div className="hidden md:flex items-center space-x-8 text-sm text-gray-300">
        <a href="#features" className="hover:text-white transition-colors">ฟีเจอร์</a>
        <a href="#about" className="hover:text-white transition-colors">เริ่มต้น</a>
        <a href="/" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-white">
          เข้าสู่แอป
        </a>
      </div>

      {/* Mobile Toggle */}
      <button 
        className="md:hidden text-gray-300 hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "ปิดเมนู" : "เปิดเมนู"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Nav */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 p-4 flex flex-col space-y-4 bg-gray-900/90 backdrop-blur-lg border-b border-white/10 md:hidden text-center"
        >
          <a href="#features" onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white">ฟีเจอร์</a>
          <a href="#about" onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white">เริ่มต้น</a>
          <a href="/" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white w-max mx-auto">
            เข้าสู่แอป
          </a>
        </motion.div>
      )}
    </nav>
  );
}
