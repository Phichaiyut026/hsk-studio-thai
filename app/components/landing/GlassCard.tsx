"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  delay?: number;
}

export default function GlassCard({ title, description, icon, delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-xl overflow-hidden relative group"
    >
      {/* Decorative gradient blob */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl group-hover:bg-teal-500/30 transition-colors duration-500" />
      
      <div className="relative z-10">
        {icon && <div className="text-teal-400 mb-4">{icon}</div>}
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}
