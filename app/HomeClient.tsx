"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SpeakButton from "./components/SpeakButton";
import Hanzi3DBackground from "./components/Hanzi3DBackground";
import { hskLevels, dailyTasks, type Level } from "../lib/hsk-data";

type Props = {
  authPaths: {
    signIn: string;
    signOut: string;
  };
  user: {
    displayName: string;
    email: string;
  } | null;
  isAdmin: boolean;
};

export default function HomeClient({ authPaths, user, isAdmin }: Props) {
  const [levels, setLevels] = useState<Level[]>(hskLevels);
  const [checkedTasks, setCheckedTasks] = useState<string[]>([]);

  useEffect(() => {
    try {
      const savedTasks = window.localStorage.getItem("hsk-daily-checked-tasks");
      if (savedTasks) setCheckedTasks(JSON.parse(savedTasks));
    } catch {
      // Ignore unavailable or malformed local progress.
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch("/api/study-data?sessionId=homepage")
      .then((response) => response.ok ? response.json() : null)
      .then((data: { levels?: Level[] } | null) => {
        if (!ignore && data?.levels?.length) setLevels(data.levels);
      })
      .catch(() => undefined);
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".scroll-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  // Daily word randomly picked or fixed based on date
  const wordOfTheDay = useMemo(() => {
    const allWords = levels.flatMap((l) => l.vocabulary);
    const dayIndex = new Date().getDate() % allWords.length;
    return allWords[dayIndex] || allWords[0];
  }, [levels]);

  const completion = Math.round((checkedTasks.length / dailyTasks.length) * 100);

  return (
    <div className="app-page min-h-screen text-[var(--ink)] flex flex-col justify-between">
      <div>
        <Navbar authPaths={authPaths} user={user} isAdmin={isAdmin} />

        {/* Hero Section */}
        <section className="hero relative overflow-hidden">
          <Hanzi3DBackground />
          <div className="hero-grid relative z-10">
            <div className="hero-copy">
              <div className="hero-kicker inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100/70 text-[var(--red)] text-xs font-bold uppercase tracking-wider mb-4">
                แพลตฟอร์มเรียนจีนสำหรับผู้เรียนไทย
              </div>
              <h1 className="text-4xl sm:text-6xl font-black text-[var(--ink)] tracking-tight leading-tight">
                เรียนภาษาจีนให้จำได้ ใช้เป็น และเห็นผลทุกวัน
              </h1>
              <p className="lead">
                แยกหน้าเรียนรู้เป็นสัดส่วน: ฝึกบัตรคำพร้อมเสียงอ่าน
                เจาะลึกบทเรียนไวยากรณ์ ทำแบบทดสอบวัดผล และคุมเวลาด้วยแผน 25
                นาทีต่อวัน
              </p>
              <div className="hero-actions">
                <a href="/vocabulary" className="primary-action">
                  เริ่มฝึกบัตรคำศัพท์
                </a>
                {isAdmin && <a href="/lessons" className="secondary-action">
                  ดูบทเรียนและไวยากรณ์
                </a>}
                {isAdmin && <a href="/quiz" className="secondary-action">
                  ทำแบบทดสอบ
                </a>}
              </div>
            </div>

            {/* Word of the Day Focus Box */}
            <div 
              className="study-board relative overflow-hidden shadow-2xl rounded-[2rem]" 
              style={{ backgroundColor: '#f7f3ec' }}
            >
              {/* Cute 3D Background Image */}
              <div className="absolute inset-0 z-0">
                <img 
                  src="/cute_flashcard.webp" 
                  className="w-full h-full object-cover opacity-60 mix-blend-multiply" 
                  alt="" 
                  aria-hidden="true" 
                  decoding="async" 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#f7f3ec]/40 via-[#f7f3ec]/70 to-[#f7f3ec]"></div>
              </div>

              <div className="relative z-10 p-2">
                <div className="board-header">
                  <span className="text-xs uppercase tracking-wider font-bold text-[var(--ink)] opacity-80">
                    คำศัพท์ประจำวันนี้
                  </span>
                  <span className="px-3 py-1 rounded-full bg-red-100/80 text-[var(--red)] text-xs font-bold border border-red-200/50">
                    ภาษาจีน
                  </span>
                </div>

                <div className="hanzi-focus text-[var(--ink)] drop-shadow-md">{wordOfTheDay.hanzi}</div>

                <div className="tone-row flex items-center justify-between p-2">
                  <div>
                    <span className="text-2xl font-black text-[var(--ink)] block drop-shadow-sm">
                      {wordOfTheDay.pinyin}
                    </span>
                    <span className="text-base font-bold text-[var(--teal)] drop-shadow-sm">
                      {wordOfTheDay.thai}
                    </span>
                  </div>
                  <SpeakButton text={wordOfTheDay.hanzi} label="ฟังเสียง" />
                </div>

                {/* Example sentence preview */}
                <div className="mt-2 p-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[var(--ink)] opacity-80 drop-shadow-sm">ตัวอย่าง:</span>
                    <SpeakButton
                      text={wordOfTheDay.example}
                      label="ฟังประโยค"
                      className="p-1 text-[10px]"
                    />
                  </div>
                  <p className="font-bold text-[var(--ink)] text-sm leading-relaxed drop-shadow-sm">{wordOfTheDay.example}</p>
                  {wordOfTheDay.exampleThai && (
                    <p className="text-[var(--muted)] mt-1 font-medium drop-shadow-sm">
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
          </div>
        </section>

        <section className="teacher-section scroll-reveal" aria-labelledby="teacher-heading">
          <div className="teacher-photo-wrap">
            <img
              className="teacher-photo"
              src="/img/1.jpg"
              alt="เม่นแนะนำตัว"
            />
          </div>
          <div className="teacher-copy">
            <span className="teacher-eyebrow">ครูผู้สอนภาษาจีน</span>
            <h2 id="teacher-heading">เรียนภาษาจีนกับครูผู้สอนที่พร้อมดูแลคุณ</h2>
            <p>
              พื้นที่แนะนำตัวและประสบการณ์ของครูผู้สอนจะเพิ่มเติมในส่วนนี้
              เพื่อให้คุณรู้จักผู้สอนก่อนเริ่มเรียน
            </p>
            <span className="teacher-placeholder">รายละเอียดเพิ่มเติมเร็ว ๆ นี้</span>
          </div>
        </section>

        {/* Feature Hub Navigation: 5 Distinct Core Pages */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center sm:text-left mb-8">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--red)]">
              เมนูหลักและห้องเรียน
            </span>
            <h2 className="text-3xl font-black text-[var(--ink)] mt-1">
              เลือกโหมดการเรียนรู้ที่คุณต้องการ
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Vocabulary & Flashcards */}
            <a
              href="/vocabulary"
              className="p-7 rounded-3xl bg-[var(--paper)] border border-[var(--line)] hover:border-black/40 hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="px-3 py-1 rounded-full bg-red-100/80 text-[var(--red)] text-xs font-bold uppercase tracking-wider inline-block mb-3">
                  โมดูล 01
                </div>
                <h3 className="text-xl font-black text-[var(--ink)] mb-2">
                  บัตรคำศัพท์และคลังศัพท์
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  ฝึกเปิดบัตรคำแบบ 3D พลิกดูคำแปล ระบบสุ่มคำ และตารางค้นหาคำศัพท์
                  คำศัพท์ภาษาจีนพร้อมเสียงอ่าน
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-black text-[var(--red)]">
                <span>เข้าสู่คลังคำศัพท์</span>
              </div>
            </a>

            {/* Card 2: Lessons & Grammar */}
            <a
              href="/lessons"
              className={`${isAdmin ? "" : "hidden"} p-7 rounded-3xl bg-[var(--paper)] border border-[var(--line)] hover:border-black/40 hover:shadow-lg transition-all flex flex-col justify-between group`}
            >
              <div>
                <div className="px-3 py-1 rounded-full bg-blue-100/80 text-[var(--blue)] text-xs font-bold uppercase tracking-wider inline-block mb-3">
                  โมดูล 02
                </div>
                <h3 className="text-xl font-black text-[var(--ink)] mb-2">
                  บทเรียนและไวยากรณ์
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  สรุปโครงสร้างไวยากรณ์จีน กฎสำคัญ สูตรการสร้างประโยค
                  และบทสนทนาจำลอง A/B ให้ฝึกโต้ตอบ
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-black text-[var(--blue)]">
                <span>เข้าสู่หน้าบทเรียน</span>
              </div>
            </a>

            {/* Card 3: Quizzes */}
            <a
              href="/quiz"
              className={`${isAdmin ? "" : "hidden"} p-7 rounded-3xl bg-[var(--paper)] border border-[var(--line)] hover:border-black/40 hover:shadow-lg transition-all flex flex-col justify-between group`}
            >
              <div>
                <div className="px-3 py-1 rounded-full bg-amber-100/80 text-amber-800 text-xs font-bold uppercase tracking-wider inline-block mb-3">
                  โมดูล 03
                </div>
                <h3 className="text-xl font-black text-[var(--ink)] mb-2">
                  ศูนย์รวมแบบทดสอบ Quiz
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  ทำแบบทดสอบวัดระดับชุดละหลายข้อ ทราบผลทันทีพร้อมคำอธิบายเฉลย
                  และบันทึกสถิติคลังคะแนน
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-black text-amber-700">
                <span>เริ่มทำแบบทดสอบ</span>
              </div>
            </a>

            {/* Card 4: Daily Plan & Pomodoro */}
            <a
              href="/plan"
              className={`${isAdmin ? "" : "hidden"} p-7 rounded-3xl bg-[var(--paper)] border border-[var(--line)] hover:border-black/40 hover:shadow-lg transition-all flex flex-col justify-between group`}
            >
              <div>
                <div className="px-3 py-1 rounded-full bg-teal-100/80 text-[var(--teal)] text-xs font-bold uppercase tracking-wider inline-block mb-3">
                  โมดูล 04
                </div>
                <h3 className="text-xl font-black text-[var(--ink)] mb-2">
                  แผนอ่าน 25 นาทีและตัวจับเวลา
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  ตารางแบ่งเวลาอ่านหนังสือ เช้า-กลางวัน-เย็น
                  พร้อมตัวจับเวลาสมาธิ Pomodoro 25 นาที และเช็คลิสต์ประจำวัน
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-black text-[var(--teal)]">
                <span>ดูแผนอ่านและจับเวลา</span>
              </div>
            </a>

            {/* Card 5: Stats & Analytics */}
            <a
              href="/stats"
              className="p-7 rounded-3xl bg-[var(--paper)] border border-[var(--line)] hover:border-black/40 hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="px-3 py-1 rounded-full bg-purple-100/80 text-purple-800 text-xs font-bold uppercase tracking-wider inline-block mb-3">
                  โมดูล 05
                </div>
                <h3 className="text-xl font-black text-[var(--ink)] mb-2">
                  สถิติและความคืบหน้า
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  ดูเปอร์เซ็นต์ความแม่นยำในการทำ Quiz
                  จำนวนคำศัพท์ที่จำได้แล้วในแต่ละระดับ และเช็คความพร้อมก่อนสอบ
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-black text-purple-700">
                <span>ดูสถิติของคุณ</span>
              </div>
            </a>
          </div>
        </section>

        {/* Level Overview Showcase */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center sm:text-left mb-6">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--red)]">
              เลือกระดับ
            </span>
            <h2 className="text-3xl font-black text-[var(--ink)] mt-1">
              ระดับภาษาจีนที่เปิดให้เรียน
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {levels.map((lvl) => (
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
                  <a
                    href={`/vocabulary?level=${lvl.id}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-black/5 hover:bg-black/10 text-[var(--ink)] text-xs font-bold text-center transition-colors"
                  >
                    บัตรคำ
                  </a>
                  {isAdmin && <a
                    href={`/quiz?level=${lvl.id}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-black/5 hover:bg-black/10 text-[var(--ink)] text-xs font-bold text-center transition-colors"
                  >
                    แบบทดสอบ
                  </a>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer isAdmin={isAdmin} />
    </div>
  );
}
