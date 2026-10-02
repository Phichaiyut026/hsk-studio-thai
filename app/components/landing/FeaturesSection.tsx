"use client";

import GlassCard from "./GlassCard";
import { BookOpen, GraduationCap, ClipboardCheck } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      title: "คลังคำศัพท์ HSK 1-6",
      description: "ฝึกด้วยแฟลชการ์ด ฟังเสียงอ่าน ดูพินอินและความหมายภาษาไทย พร้อมบันทึกคำที่จำได้แล้ว",
      icon: <BookOpen size={32} />
    },
    {
      title: "บทเรียนทีละขั้น",
      description: "เรียนตามแผนที่จัดลำดับไว้ให้ ตั้งแต่พื้นฐานไปจนถึงระดับสูง พร้อมภารกิจประจำวัน",
      icon: <GraduationCap size={32} />
    },
    {
      title: "ข้อสอบจำลอง HSK",
      description: "ทำข้อสอบฟังและอ่านในรูปแบบเดียวกับสนามจริง จับเวลา และดูสถิติคะแนนย้อนหลัง",
      icon: <ClipboardCheck size={32} />
    }
  ];

  return (
    <section id="features" className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          ทุกอย่างที่ต้องใช้ใน<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">ที่เดียว</span>
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          ตั้งแต่จำคำแรกจนถึงวันสอบจริง
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <GlassCard 
            key={index}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            delay={index * 0.2}
          />
        ))}
      </div>
    </section>
  );
}
