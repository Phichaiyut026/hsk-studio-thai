"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SpeakButton from "./components/SpeakButton";
import { hskLevels, dailyTasks } from "../lib/hsk-data";

type Props = {
  authPaths: {
    signIn: string;
    signOut: string;
  };
  user: {
    displayName: string;
    email: string;
  } | null;
};

export default function HomeClient({ authPaths, user }: Props) {
  const [checkedTasks] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const savedTasks = window.localStorage.getItem("hsk-daily-checked-tasks");
      return savedTasks ? JSON.parse(savedTasks) : [];
    } catch {
      return [];
    }
  });

  // Daily word randomly picked or fixed based on date
  const wordOfTheDay = useMemo(() => {
    const allWords = hskLevels.flatMap((l) => l.vocabulary);
    const dayIndex = new Date().getDate() % allWords.length;
    return allWords[dayIndex] || allWords[0];
  }, []);

  const completion = Math.round((checkedTasks.length / dailyTasks.length) * 100);

  return (
    <div className="min-h-screen bg-[var(--page)] text-[var(--ink)] flex flex-col justify-between">
      <div>
        <Navbar authPaths={authPaths} user={user} />

        {/* Hero Section */}
        <section className="hero">
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100/70 text-[var(--red)] text-xs font-bold uppercase tracking-wider mb-4">
                แพลตฟอร์มเรียนจีนสำหรับผู้เรียนไทย
              </div>
              <h1 className="text-4xl sm:text-6xl font-black text-[var(--ink)] tracking-tight leading-tight">
                เรียน HSK ให้จำได้ ใช้เป็น และเห็นผลทุกวัน
              </h1>
              <p className="lead">
                แยกหน้าเรียนรู้เป็นสัดส่วน: ฝึกบัตรคำพร้อมเสียงอ่าน
                เจาะลึกบทเรียนไวยากรณ์ ทำแบบทดสอบวัดผล และคุมเวลาด้วยแผน 25
                นาทีต่อวัน
              </p>
              <div className="hero-actions">
                <Link href="/vocabulary" className="primary-action">
                  เริ่มฝึกบัตรคำศัพท์
                </Link>
                <Link href="/lessons" className="secondary-action">
                  ดูบทเรียน & ไวยากรณ์
                </Link>
                <Link href="/quiz" className="secondary-action">
                  ทำแบบทดสอบ
                </Link>
              </div>
            </div>

            {/* Word of the Day Focus Box */}
            <div className="study-board">
              <div className="board-header">
                <span className="text-xs uppercase tracking-wider font-bold">
                  คำศัพท์ประจำวันนี้
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-[var(--red)] text-xs font-bold">
                  HSK
                </span>
              </div>

              <div className="hanzi-focus">{wordOfTheDay.hanzi}</div>

              <div className="tone-row flex items-center justify-between">
                <div>
                  <span className="text-xl font-black text-[var(--ink)] block">
                    {wordOfTheDay.pinyin}
                  </span>
                  <span className="text-sm font-bold text-[var(--teal)]">
                    {wordOfTheDay.thai}
                  </span>
                </div>
                <SpeakButton text={wordOfTheDay.hanzi} label="ฟังเสียง" />
              </div>

              {/* Example sentence preview */}
              <div className="mt-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-900">ตัวอย่าง:</span>
                  <SpeakButton
                    text={wordOfTheDay.example}
                    label=""
                    className="p-1 text-[10px]"
                  />
                </div>
                <p className="font-bold text-amber-950">{wordOfTheDay.example}</p>
                {wordOfTheDay.exampleThai && (
                  <p className="text-amber-800/80 mt-0.5">
                    {wordOfTheDay.exampleThai}
                  </p>
                )}
              </div>

              {/* Progress Ring */}
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-[var(--line)] text-xs font-bold text-[var(--muted)]">
                <span>ความคืบหน้าภารกิจวันนี้</span>
                <span className="text-[var(--teal)] font-black">
                  {checkedTasks.length}/{dailyTasks.length} ({completion}%)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Hub Navigation: 5 Distinct Core Pages */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center sm:text-left mb-8">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--red)]">
              เมนูหลัก & ห้องเรียน
            </span>
            <h2 className="text-3xl font-black text-[var(--ink)] mt-1">
              เลือกโหมดการเรียนรู้ที่คุณต้องการ
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Vocabulary & Flashcards */}
            <Link
              href="/vocabulary"
              className="p-7 rounded-3xl bg-[var(--paper)] border border-[var(--line)] hover:border-black/40 hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <h3 className="text-xl font-black text-[var(--ink)] mb-2">
                  บัตรคำศัพท์ & คลังศัพท์
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  ฝึกเปิดบัตรคำแบบ 3D พลิกดูคำแปล ระบบสุ่มคำ และตารางค้นหาคำศัพท์
                  HSK 1 - 4 พร้อมเสียงอ่านภาษาจีน
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-black text-[var(--red)]">
                <span>เข้าสู่คลังคำศัพท์ →</span>
              </div>
            </Link>

            {/* Card 2: Lessons & Grammar */}
            <Link
              href="/lessons"
              className="p-7 rounded-3xl bg-[var(--paper)] border border-[var(--line)] hover:border-black/40 hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <h3 className="text-xl font-black text-[var(--ink)] mb-2">
                  บทเรียน & ไวยากรณ์
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  สรุปโครงสร้างไวยากรณ์จีน กฎสำคัญ สูตรการสร้างประโยค
                  และบทสนทนาจำลอง A/B ให้ฝึกโต้ตอบ
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-black text-[var(--blue)]">
                <span>เข้าสู่หน้าบทเรียน →</span>
              </div>
            </Link>

            {/* Card 3: Quizzes */}
            <Link
              href="/quiz"
              className="p-7 rounded-3xl bg-[var(--paper)] border border-[var(--line)] hover:border-black/40 hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <h3 className="text-xl font-black text-[var(--ink)] mb-2">
                  ศูนย์รวมแบบทดสอบ Quiz
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  ทำแบบทดสอบวัดระดับชุดละหลายข้อ ทราบผลทันทีพร้อมคำอธิบายเฉลย
                  และบันทึกสถิติคลังคะแนน
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-black text-amber-700">
                <span>เริ่มทำแบบทดสอบ →</span>
              </div>
            </Link>

            {/* Card 4: Daily Plan & Pomodoro */}
            <Link
              href="/plan"
              className="p-7 rounded-3xl bg-[var(--paper)] border border-[var(--line)] hover:border-black/40 hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <h3 className="text-xl font-black text-[var(--ink)] mb-2">
                  แผนอ่าน 25 นาที & ตัวจับเวลา
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  ตารางแบ่งเวลาอ่านหนังสือ เช้า-กลางวัน-เย็น
                  พร้อมตัวจับเวลาสมาธิ Pomodoro 25 นาที และเช็คลิสต์ประจำวัน
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-black text-[var(--teal)]">
                <span>ดูแผนอ่าน & จับเวลา →</span>
              </div>
            </Link>

            {/* Card 5: Stats & Analytics */}
            <Link
              href="/stats"
              className="p-7 rounded-3xl bg-[var(--paper)] border border-[var(--line)] hover:border-black/40 hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <h3 className="text-xl font-black text-[var(--ink)] mb-2">
                  สถิติและความคืบหน้า
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  ดูเปอร์เซ็นต์ความแม่นยำในการทำ Quiz
                  จำนวนคำศัพท์ที่จำได้แล้วในแต่ละระดับ และเช็คความพร้อมก่อนสอบ
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-black text-purple-700">
                <span>ดูสถิติของคุณ →</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Level Overview Showcase */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center sm:text-left mb-6">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--red)]">
              เลือกระดับ
            </span>
            <h2 className="text-3xl font-black text-[var(--ink)] mt-1">
              ระดับ HSK ที่เปิดให้เรียน
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {hskLevels.map((lvl) => (
              <div
                key={lvl.id}
                className="p-6 rounded-3xl bg-[var(--paper)] border border-[var(--line)] flex flex-col justify-between shadow-xs hover:shadow-md transition-all"
                style={{ borderTop: `5px solid ${lvl.color}` }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-black text-[var(--ink)]">
                      {lvl.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-black/5 text-xs font-bold">
                      {lvl.words} คำ
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-700 mb-2">{lvl.target}</p>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">{lvl.focus}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--line)]/60 flex flex-wrap gap-2">
                  <Link
                    href={`/vocabulary?level=${lvl.id}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-black/5 hover:bg-black/10 text-[var(--ink)] text-xs font-bold text-center transition-colors"
                  >
                    บัตรคำ
                  </Link>
                  <Link
                    href={`/quiz?level=${lvl.id}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-black/5 hover:bg-black/10 text-[var(--ink)] text-xs font-bold text-center transition-colors"
                  >
                    Quiz
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
