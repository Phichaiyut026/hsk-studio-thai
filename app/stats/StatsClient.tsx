"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { hskLevels } from "../../lib/hsk-data";

type QuizStats = {
  totalAttempts: number;
  correctAttempts: number;
};

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

function getSessionId() {
  if (typeof window === "undefined") return "";
  const key = "hsk-studio-session-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const next = crypto.randomUUID();
  window.localStorage.setItem(key, next);
  return next;
}

export default function StatsClient({ authPaths, user }: Props) {
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);

  const [masteredWords] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem("hsk-mastered-words");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [checkedTasks] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem("hsk-daily-checked-tasks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let ignore = false;
    async function loadStats() {
      try {
        const sessionId = getSessionId();
        const res = await fetch(`/api/study-data?sessionId=${encodeURIComponent(sessionId)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { stats?: QuizStats };
        if (!ignore && data.stats) {
          setQuizStats(data.stats);
        }
      } catch {
        // ignore
      }
    }
    loadStats();
    return () => {
      ignore = true;
    };
  }, []);

  const totalWordsInApp = hskLevels.reduce((acc, l) => acc + l.vocabulary.length, 0);
  const accuracyPercent =
    quizStats && quizStats.totalAttempts > 0
      ? Math.round((quizStats.correctAttempts / quizStats.totalAttempts) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[var(--page)] text-[var(--ink)] flex flex-col justify-between">
      <div>
        <Navbar authPaths={authPaths} user={user} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider mb-2">
              รายงาน & สถิติ
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--ink)]">
              สถิติและความคืบหน้าการเรียน
            </h1>
            <p className="text-[var(--muted)] text-base mt-2 max-w-2xl">
              ติดตามพัฒนาการการจำศัพท์ ผลคะแนนแบบทดสอบ และความพร้อมในการสอบ HSK
            </p>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {/* Card 1: Quiz Accuracy */}
            <div className="p-6 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xs">
              <span className="text-xs font-black uppercase text-[var(--muted)] tracking-wider">
                อัตราความถูกต้อง Quiz
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-black text-[var(--teal)]">
                  {accuracyPercent}%
                </span>
                <span className="text-xs font-bold text-[var(--muted)]">
                  ({quizStats?.correctAttempts || 0}/{quizStats?.totalAttempts || 0} ข้อ)
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {accuracyPercent >= 80
                  ? "ยอดเยี่ยมมาก อยู่ในเกณฑ์ผ่านฉลุย"
                  : "ฝึกทำข้อสอบเพิ่มเติมเพื่อเพิ่มเปอร์เซ็นต์"}
              </p>
            </div>

            {/* Card 2: Mastered Vocab */}
            <div className="p-6 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xs">
              <span className="text-xs font-black uppercase text-[var(--muted)] tracking-wider">
                คำศัพท์ที่จำได้แล้ว
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-black text-[var(--blue)]">
                  {masteredWords.length}
                </span>
                <span className="text-xs font-bold text-[var(--muted)]">
                  / {totalWordsInApp} คำ
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                บันทึกจากการกดทำเครื่องหมายในการ์ดคำศัพท์
              </p>
            </div>

            {/* Card 3: Today's Tasks */}
            <div className="p-6 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xs">
              <span className="text-xs font-black uppercase text-[var(--muted)] tracking-wider">
                ภารกิจประจำวันนี้
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-black text-[var(--gold)]">
                  {checkedTasks.length}
                </span>
                <span className="text-xs font-bold text-[var(--muted)]">
                  ภารกิจสำเร็จ
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                ความสม่ำเสมอคือกุญแจสำคัญที่สุด
              </p>
            </div>

            {/* Card 4: Account status */}
            <div className="p-6 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xs">
              <span className="text-xs font-black uppercase text-[var(--muted)] tracking-wider">
                สถานะการซิงค์ข้อมูล
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[var(--ink)]">
                  {user ? "ซิงค์แล้ว" : "เก็บในเครื่อง"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {user
                  ? `เข้าสู่ระบบโดย ${user.displayName}`
                  : "เข้าสู่ระบบเพื่อบันทึกประวัติถาวร"}
              </p>
            </div>
          </div>

          {/* Level Breakdown Section */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xs space-y-6 mb-10">
            <h2 className="text-2xl font-black text-[var(--ink)] flex items-center gap-2">
              <span>ความคืบหน้ารายระดับ (Level Readiness)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hskLevels.map((lvl) => {
                const levelWordsCount = lvl.vocabulary.length;
                const masteredInThisLevel = lvl.vocabulary.filter((w) =>
                  masteredWords.includes(w.id)
                ).length;
                const levelPercent = Math.round(
                  (masteredInThisLevel / levelWordsCount) * 100
                );

                return (
                  <div
                    key={lvl.id}
                    className="p-5 rounded-2xl bg-white border border-[var(--line)] space-y-3"
                    style={{ borderTop: `4px solid ${lvl.color}` }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-[var(--ink)]">
                          {lvl.title}
                        </h3>
                        <p className="text-xs text-[var(--muted)]">{lvl.target}</p>
                      </div>
                      <span className="text-lg font-black" style={{ color: lvl.color }}>
                        {levelPercent}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${levelPercent}%`,
                          backgroundColor: lvl.color,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 text-xs">
                      <span className="text-[var(--muted)] font-semibold">
                        จำได้ {masteredInThisLevel} / {levelWordsCount} คำในระบบ
                      </span>
                      <Link
                        href={`/vocabulary?level=${lvl.id}`}
                        className="font-bold text-[var(--ink)] hover:underline"
                      >
                        ทบทวนศัพท์
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-teal-900 to-slate-900 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-2xl font-black">พร้อมฝึกฝนต่อแล้วหรือยัง?</h3>
              <p className="text-sm text-gray-300">
                เลือกกิจกรรมที่คุณต้องการทำต่อวันนี้เพื่อสร้างความคุ้นเคย
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/vocabulary"
                className="px-5 py-2.5 rounded-xl bg-white text-gray-900 font-black text-sm shadow-md hover:bg-gray-100 transition-all"
              >
                ทบทวนบัตรคำ
              </Link>
              <Link
                href="/quiz"
                className="px-5 py-2.5 rounded-xl bg-[var(--red)] text-white font-black text-sm shadow-md hover:opacity-90 transition-all"
              >
                ทำแบบทดสอบ
              </Link>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
