"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { dailyTasks, hskLevels, type Level } from "../../lib/hsk-data";

type QuizStats = {
  totalAttempts: number;
  correctAttempts: number;
};

type ProgressStats = {
  levels: Array<{
    levelId: string;
    title: string;
    color: string;
    totalWords: number;
    totalQuestions: number;
    totalAttempts: number;
    correctAttempts: number;
    accuracyPercent: number;
    lastAttemptAt: string | null;
  }>;
  recentAttempts: Array<{
    id: string;
    levelId: string;
    prompt: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    createdAt: string;
  }>;
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
  const [levels, setLevels] = useState<Level[]>(hskLevels);
  const [isAdmin, setIsAdmin] = useState(false);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [progress, setProgress] = useState<ProgressStats | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/auth/role")
      .then((response) => response.ok ? response.json() : { isAdmin: false })
      .then((data: { isAdmin?: boolean }) => setIsAdmin(data.isAdmin === true))
      .catch(() => setIsAdmin(false));
  }, [user]);

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
        const data = (await res.json()) as { levels?: Level[]; stats?: QuizStats; progress?: ProgressStats };
        if (!ignore && data.levels && data.levels.length > 0) {
          setLevels(data.levels);
        }
        if (!ignore && data.stats) {
          setQuizStats(data.stats);
        }
        if (!ignore && data.progress) {
          setProgress(data.progress);
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

  const totalWordsInApp = progress?.levels.reduce((acc, level) => acc + level.totalWords, 0) ??
    levels.reduce((acc, l) => acc + l.vocabulary.length, 0);
  const totalQuestionsInApp = progress?.levels.reduce((acc, level) => acc + level.totalQuestions, 0) ?? 0;
  const accuracyPercent =
    quizStats && quizStats.totalAttempts > 0
      ? Math.round((quizStats.correctAttempts / quizStats.totalAttempts) * 100)
      : 0;
  const attemptedLevels = progress?.levels.filter((level) => level.totalAttempts > 0).length ?? 0;
  const weakestLevel = progress?.levels
    .filter((level) => level.totalAttempts > 0)
    .sort((a, b) => a.accuracyPercent - b.accuracyPercent)[0];

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
                {quizStats?.totalAttempts
                  ? accuracyPercent >= 80
                    ? "ยอดเยี่ยมมาก อยู่ในเกณฑ์ผ่านฉลุย"
                    : "ฝึกทำข้อสอบเพิ่มเติมเพื่อเพิ่มเปอร์เซ็นต์"
                  : "เริ่มทำ Mock Exam เพื่อสร้างสถิติแรก"}
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
                {attemptedLevels}
              </span>
              <span className="text-xs font-bold text-[var(--muted)]">
                  ระดับที่เริ่มสอบแล้ว
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
                จากทั้งหมด {levels.length} ระดับในระบบ
            </p>
          </div>

            {/* Card 4: Question bank */}
            <div className="p-6 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xs">
              <span className="text-xs font-black uppercase text-[var(--muted)] tracking-wider">
                คลังข้อสอบ Mock Exam
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-black text-[var(--ink)]">
                  {totalQuestionsInApp}
                </span>
                <span className="text-xs font-bold text-[var(--muted)]">ข้อ</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {user ? `สถิติผูกกับบัญชี ${user.displayName}` : "สถิติเก็บตาม session ในเครื่องนี้"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 mb-10">
            <section className="p-6 sm:p-8 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xs">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-[var(--ink)]">ภาพรวมการสอบ</h2>
                  <p className="text-sm text-[var(--muted)] mt-1">
                    ระบบคำนวณจากคำตอบที่บันทึกจริงใน Mock Exam
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-white border border-[var(--line)] text-xs font-black text-[var(--ink)]">
                  {quizStats?.totalAttempts ?? 0} attempts
                </span>
              </div>

              <div className="space-y-4">
                {(progress?.levels ?? []).map((level) => (
                  <div key={level.levelId} className="rounded-2xl border border-[var(--line)] bg-white p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-black text-[var(--ink)]">{level.title}</h3>
                        <p className="text-xs text-[var(--muted)]">
                          {level.totalQuestions} ข้อสอบ | {level.totalWords} คำศัพท์ | ทำแล้ว {level.totalAttempts} ครั้ง
                        </p>
                      </div>
                      <span className="text-xl font-black" style={{ color: level.color }}>
                        {level.accuracyPercent}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${level.accuracyPercent}%`, backgroundColor: level.color }}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
                      <span>ถูก {level.correctAttempts} / {level.totalAttempts} ครั้ง</span>
                      {isAdmin && <Link href={`/quiz?level=${level.levelId}`} prefetch={false} className="text-[var(--ink)] font-black hover:underline">
                        ทำ Mock Exam
                      </Link>}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="space-y-6">
              <section className="p-6 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xs">
                <span className="text-xs font-black uppercase text-[var(--muted)] tracking-wider">Next Focus</span>
                <h2 className="text-2xl font-black mt-2 text-[var(--ink)]">
                  {weakestLevel ? weakestLevel.title : "เริ่มจาก HSK 1"}
                </h2>
                <p className="text-sm text-[var(--muted)] mt-2">
                  {weakestLevel
                    ? `ระดับนี้มีความถูกต้อง ${weakestLevel.accuracyPercent}% เหมาะกับการทบทวนรอบถัดไป`
                    : "ยังไม่มีประวัติสอบ ลองทำ Mock Exam สักชุดเพื่อให้ระบบแนะนำได้แม่นขึ้น"}
                </p>
                {isAdmin && <Link
                  href={weakestLevel ? `/quiz?level=${weakestLevel.levelId}` : "/quiz"}
                  prefetch={false}
                  className="mt-5 inline-flex px-5 py-2.5 rounded-xl bg-[var(--ink)] text-white font-black text-sm"
                >
                  เริ่มฝึกต่อ
                </Link>}
              </section>

              <section className="p-6 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xs">
                <span className="text-xs font-black uppercase text-[var(--muted)] tracking-wider">Daily Plan</span>
                <div className="mt-4 space-y-3">
                  {dailyTasks.slice(0, 4).map((task) => (
                    <div key={task} className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-bold text-[var(--ink)]">{task}</span>
                      <span className="text-xs font-black text-[var(--muted)]">
                        {checkedTasks.includes(task) ? "เสร็จแล้ว" : "รอทำ"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>

          <section className="p-6 sm:p-8 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xs mb-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-black text-[var(--ink)]">ประวัติการทำข้อสอบล่าสุด</h2>
                <p className="text-sm text-[var(--muted)] mt-1">
                  ดูข้อผิดพลาดล่าสุดเพื่อกลับไปทบทวนจุดที่ยังไม่แม่น
                </p>
              </div>
              {isAdmin && <Link href="/quiz" prefetch={false} className="text-sm font-black text-[var(--ink)] hover:underline">
                ไปหน้า Mock Exam
              </Link>}
            </div>

            {progress?.recentAttempts.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-left text-xs uppercase text-[var(--muted)]">
                      <th className="py-3 pr-4 font-black">ระดับ</th>
                      <th className="py-3 pr-4 font-black">คำถาม</th>
                      <th className="py-3 pr-4 font-black">คำตอบของคุณ</th>
                      <th className="py-3 pr-4 font-black">เฉลย</th>
                      <th className="py-3 pr-4 font-black">ผล</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.recentAttempts.map((attempt) => {
                      const levelTitle = levels.find((level) => level.id === attempt.levelId)?.title ?? attempt.levelId.toUpperCase();
                      return (
                        <tr key={attempt.id} className="border-b border-[var(--line)] last:border-0">
                          <td className="py-4 pr-4 font-black text-[var(--ink)] whitespace-nowrap">{levelTitle}</td>
                          <td className="py-4 pr-4 text-[var(--ink)] min-w-[260px]">{attempt.prompt}</td>
                          <td className="py-4 pr-4 text-[var(--muted)]">{attempt.selectedAnswer}</td>
                          <td className="py-4 pr-4 text-[var(--muted)]">{attempt.correctAnswer || "-"}</td>
                          <td className="py-4 pr-4">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${
                                attempt.isCorrect
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {attempt.isCorrect ? "ถูก" : "ผิด"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-8 text-center">
                <h3 className="font-black text-[var(--ink)]">ยังไม่มีประวัติการทำข้อสอบ</h3>
                <p className="text-sm text-[var(--muted)] mt-2">
                  เมื่อทำ Mock Exam แล้ว ประวัติคำตอบจะมาแสดงตรงนี้ทันที
                </p>
              </div>
            )}
          </section>

          {/* Level Breakdown Section */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xs space-y-6 mb-10">
            <h2 className="text-2xl font-black text-[var(--ink)] flex items-center gap-2">
              <span>ความคืบหน้ารายระดับ (Level Readiness)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {levels.map((lvl) => {
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
                        prefetch={false}
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
                prefetch={false}
                className="px-5 py-2.5 rounded-xl bg-white text-gray-900 font-black text-sm shadow-md hover:bg-gray-100 transition-all"
              >
                ทบทวนบัตรคำ
              </Link>
              {isAdmin && <Link
                href="/quiz"
                prefetch={false}
                className="px-5 py-2.5 rounded-xl bg-[var(--red)] text-white font-black text-sm shadow-md hover:opacity-90 transition-all"
              >
                ทำแบบทดสอบ
              </Link>}
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
