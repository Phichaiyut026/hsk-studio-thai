"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { dailyTasks as defaultTasks, studyTips } from "../../lib/hsk-data";

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

export default function PlanClient({ authPaths, user }: Props) {
  const [tasks, setTasks] = useState<string[]>(() => {
    if (typeof window === "undefined") return defaultTasks;
    try {
      const savedTasks = window.localStorage.getItem("hsk-custom-tasks");
      return savedTasks ? JSON.parse(savedTasks) : defaultTasks;
    } catch {
      return defaultTasks;
    }
  });

  const [checkedTasks, setCheckedTasks] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const savedChecked = window.localStorage.getItem("hsk-daily-checked-tasks");
      return savedChecked ? JSON.parse(savedChecked) : [];
    } catch {
      return [];
    }
  });

  const [newTaskInput, setNewTaskInput] = useState("");

  // Pomodoro Timer State (25 mins focus, 5 mins break)
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");

  // Timer tick effect
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  function toggleTask(task: string) {
    setCheckedTasks((prev) => {
      const next = prev.includes(task)
        ? prev.filter((t) => t !== task)
        : [...prev, task];
      try {
        window.localStorage.setItem("hsk-daily-checked-tasks", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const updated = [...tasks, newTaskInput.trim()];
    setTasks(updated);
    try {
      window.localStorage.setItem("hsk-custom-tasks", JSON.stringify(updated));
    } catch {
      // ignore
    }
    setNewTaskInput("");
  }

  function handleResetDailyTasks() {
    setCheckedTasks([]);
    try {
      window.localStorage.setItem("hsk-daily-checked-tasks", JSON.stringify([]));
    } catch {
      // ignore
    }
  }

  function switchTimerMode(mode: "focus" | "break") {
    setIsTimerRunning(false);
    setTimerMode(mode);
    setTimerSeconds(mode === "focus" ? 25 * 60 : 5 * 60);
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const completionPercent =
    tasks.length > 0
      ? Math.round((checkedTasks.length / tasks.length) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[var(--page)] text-[var(--ink)] flex flex-col justify-between">
      <div>
        <Navbar authPaths={authPaths} user={user} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-[var(--teal)] text-xs font-bold uppercase tracking-wider mb-2">
              แผนการเรียน & ตัวช่วยจับเวลา
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--ink)]">
              แผนอ่านรายวัน 25 นาที & โฟกัสทามเมอร์
            </h1>
            <p className="text-[var(--muted)] text-base mt-2 max-w-2xl">
              เทคนิคเรียนภาษาจีนแบบไม่อึดอัด แบ่งย่อยเป็น 3 ช่วงเวลา
              พร้อมนาฬิกาจับเวลาช่วยคุมสมาธิในการจำศัพท์
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Study Plan & Daily Checklist */}
            <div className="lg:col-span-2 space-y-8">
              {/* Daily Roadmap Timeline */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-[var(--ink)] flex items-center gap-2">
                    <span>ตารางแบ่งเวลา 25 นาทีต่อวัน (ไม่ฝืน)</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                        ช่วงเช้า (8 นาที)
                      </span>
                      <h3 className="text-base font-black text-amber-950 mt-2">
                        เปิดบัตรคำ & ฟังเสียง
                      </h3>
                      <p className="text-xs text-amber-900/80 mt-1">
                        ทบทวนศัพท์ใหม่ 8-12 คำ ฟังเสียงออกเสียงในใจก่อนเริ่มวัน
                      </p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-amber-200 text-xs font-bold text-amber-800">
                      8 นาที
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-[var(--teal)] uppercase tracking-wider">
                        กลางวัน (7 นาที)
                      </span>
                      <h3 className="text-base font-black text-teal-950 mt-2">
                        แต่งประโยคสั้น
                      </h3>
                      <p className="text-xs text-teal-900/80 mt-1">
                        หยิบคำศัพท์มาแต่ง 2-3 ประโยคในบริบทชีวิตจริง
                      </p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-teal-200 text-xs font-bold text-[var(--teal)]">
                      7 นาที
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-[var(--blue)] uppercase tracking-wider">
                        ช่วงเย็น (10 นาที)
                      </span>
                      <h3 className="text-base font-black text-blue-950 mt-2">
                        ทำ Quiz & เช็คจุดผิด
                      </h3>
                      <p className="text-xs text-blue-900/80 mt-1">
                        ทำแบบทดสอบวัดผล 5 ข้อ และอ่านคำอธิบายเฉลย
                      </p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-blue-200 text-xs font-bold text-[var(--blue)]">
                      10 นาที
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Daily Checklist */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-black text-[var(--ink)] flex items-center gap-2">
                      <span>ภารกิจรายวัน (Daily Tasks)</span>
                    </h2>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      ทำสำเร็จแล้ว {checkedTasks.length} จาก {tasks.length} ภารกิจ ({completionPercent}%)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetDailyTasks}
                    className="text-xs font-bold text-gray-500 hover:text-black self-start sm:self-auto underline"
                  >
                    รีเซ็ตภารกิจของวันนี้
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-[var(--teal)] transition-all duration-300 rounded-full"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>

                {/* Tasks items */}
                <div className="space-y-2.5">
                  {tasks.map((task) => {
                    const isChecked = checkedTasks.includes(task);
                    return (
                      <label
                        key={task}
                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? "bg-teal-50/70 border-teal-300 text-teal-950"
                            : "bg-white border-[var(--line)] hover:border-gray-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleTask(task)}
                          className="w-5 h-5 accent-[var(--teal)] rounded"
                        />
                        <span
                          className={`text-sm font-bold flex-1 ${
                            isChecked ? "line-through opacity-70" : ""
                          }`}
                        >
                          {task}
                        </span>
                        {isChecked && (
                          <span className="text-xs font-black text-[var(--teal)]">
                            สำเร็จ
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>

                {/* Add Custom Task Form */}
                <form onSubmit={handleAddTask} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    placeholder="เพิ่มภารกิจของคุณเอง..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--line)] bg-white text-sm focus:outline-none focus:border-[var(--ink)]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[var(--ink)] text-white text-sm font-bold rounded-xl hover:bg-black transition-colors"
                  >
                    เพิ่ม
                  </button>
                </form>
              </div>

              {/* Study Tips for Thai Learners */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xs space-y-4">
                <h2 className="text-xl font-black text-[var(--ink)] flex items-center gap-2">
                  <span>เคล็ดลับจำจีนเร็วสำหรับคนไทย</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {studyTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white border border-[var(--line)] space-y-1.5 shadow-xs"
                    >
                      <h3 className="font-bold text-sm text-[var(--ink)]">
                        {tip.title}
                      </h3>
                      <p className="text-xs text-[var(--muted)] leading-relaxed">
                        {tip.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Focus Timer */}
            <div className="space-y-6">
              {/* Pomodoro Timer */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-md text-center space-y-6">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">
                    Pomodoro Study Timer
                  </span>
                  <h2 className="text-xl font-black text-[var(--ink)] mt-1">
                    ตัวจับเวลาสมาธิ
                  </h2>
                </div>

                {/* Mode Selector */}
                <div className="flex justify-center p-1 bg-black/5 rounded-xl max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => switchTimerMode("focus")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      timerMode === "focus"
                        ? "bg-white text-[var(--ink)] shadow-xs"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    เรียน 25 นาที
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTimerMode("break")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      timerMode === "break"
                        ? "bg-white text-[var(--ink)] shadow-xs"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    พัก 5 นาที
                  </button>
                </div>

                {/* Big Timer Display */}
                <div className="py-6 my-2 rounded-2xl bg-white border border-[var(--line)] shadow-inner">
                  <span className="text-5xl sm:text-6xl font-black tracking-tight text-[var(--ink)] font-mono">
                    {formatTime(timerSeconds)}
                  </span>
                  <p className="text-xs text-[var(--muted)] font-semibold mt-2">
                    {isTimerRunning
                      ? timerMode === "focus"
                        ? "กำลังโฟกัสการฝึกภาษาจีน..."
                        : "กำลังพักสายตา..."
                      : timerSeconds === 0
                      ? "ครบเวลาแล้ว"
                      : "กดเริ่มเมื่อพร้อม"}
                  </p>
                </div>

                {/* Timer Controls */}
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`px-6 py-3 rounded-xl font-bold text-sm text-white shadow-md transition-transform active:scale-95 ${
                      isTimerRunning
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-[var(--teal)] hover:bg-teal-700"
                    }`}
                  >
                    {isTimerRunning ? "พักชั่วคราว" : "เริ่มจับเวลา"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTimerRunning(false);
                      setTimerSeconds(timerMode === "focus" ? 25 * 60 : 5 * 60);
                    }}
                    className="px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-[var(--ink)] font-bold text-sm transition-colors"
                  >
                    รีเซ็ต
                  </button>
                </div>
              </div>

              {/* Quick Summary Box */}
              <div className="p-6 rounded-3xl bg-[var(--paper)] border border-[var(--line)] space-y-3 text-xs">
                <h3 className="font-bold text-[var(--ink)] text-sm">
                  ข้อแนะนำสำหรับแผนวันนี้
                </h3>
                <p className="text-[var(--muted)] leading-relaxed">
                  อย่ากังวลหากจำไม่ได้ทั้งหมดในรอบแรก การเห็นคำศัพท์ซ้ำ 3-5
                  วันติดต่อกันจะทำให้สมองจดจำได้เองโดยธรรมชาติ
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
