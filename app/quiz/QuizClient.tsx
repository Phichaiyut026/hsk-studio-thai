"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { hskLevels, type QuizItem } from "../../lib/hsk-data";

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

export default function QuizClient({ authPaths, user }: Props) {
  const [selectedLevelId, setSelectedLevelId] = useState<string>("hsk1");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "offline">("idle");

  const activeLevel = useMemo(() => {
    return hskLevels.find((l) => l.id === selectedLevelId) || hskLevels[0];
  }, [selectedLevelId]);

  const questionsList: QuizItem[] = useMemo(() => {
    return activeLevel.quizzes && activeLevel.quizzes.length > 0
      ? activeLevel.quizzes
      : [activeLevel.quiz];
  }, [activeLevel]);

  const currentQuestion = questionsList[questionIndex] || questionsList[0];

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

  function handleSelectLevel(levelId: string) {
    setSelectedLevelId(levelId);
    setQuestionIndex(0);
    setSelectedAnswer("");
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsFinished(false);
    setSaveStatus("idle");
  }

  async function handleChooseAnswer(choice: string) {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(choice);
    setIsAnswerSubmitted(true);

    const isCorrect = choice === currentQuestion.answer;
    if (isCorrect) {
      setScore((s) => s + 1);
    }

    // Save attempt to backend
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/quiz-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          levelId: activeLevel.id,
          questionId: currentQuestion.id,
          selectedAnswer: choice,
        }),
      });

      if (!response.ok) throw new Error("Could not save quiz attempt");
      const data = (await response.json()) as { stats?: QuizStats };
      if (data.stats) {
        setQuizStats(data.stats);
      }
      setSaveStatus("saved");
    } catch {
      setSaveStatus("offline");
    }
  }

  function handleNextQuestion() {
    if (questionIndex + 1 < questionsList.length) {
      setQuestionIndex((prev) => prev + 1);
      setSelectedAnswer("");
      setIsAnswerSubmitted(false);
    } else {
      setIsFinished(true);
    }
  }

  function handleRestart() {
    setQuestionIndex(0);
    setSelectedAnswer("");
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsFinished(false);
  }

  return (
    <div className="min-h-screen bg-[var(--page)] text-[var(--ink)] flex flex-col justify-between">
      <div>
        <Navbar authPaths={authPaths} user={user} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
              แบบทดสอบ & วัดระดับ
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-[var(--ink)]">
                  ศูนย์รวมแบบทดสอบ HSK
                </h1>
                <p className="text-[var(--muted)] text-base mt-1">
                  ทดสอบความเข้าใจคำศัพท์ ไวยากรณ์ และประโยค พร้อมเฉลยละเอียด
                </p>
              </div>
              {quizStats && (
                <div className="p-3 bg-white rounded-2xl border border-[var(--line)] text-center shadow-xs">
                  <span className="text-xs font-bold text-[var(--muted)] block">
                    สถิติรวมของคุณ
                  </span>
                  <span className="text-lg font-black text-[var(--teal)]">
                    {quizStats.correctAttempts} / {quizStats.totalAttempts} ข้อถูก (
                    {Math.round(
                      (quizStats.correctAttempts / (quizStats.totalAttempts || 1)) * 100
                    )}
                    %)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Level Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {hskLevels.map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => handleSelectLevel(lvl.id)}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                  selectedLevelId === lvl.id
                    ? "bg-[var(--ink)] text-white border-[var(--ink)] shadow-md"
                    : "bg-[var(--paper)] text-[var(--ink)] border-[var(--line)] hover:border-black/30"
                }`}
              >
                {lvl.title} Quiz
              </button>
            ))}
          </div>

          {!isFinished ? (
            /* Quiz In Progress */
            <div className="p-6 sm:p-10 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-lg space-y-6">
              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[var(--muted)] mb-2">
                  <span>
                    ข้อที่ {questionIndex + 1} จาก {questionsList.length}
                  </span>
                  <span>คะแนนปัจจุบัน: {score}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-[var(--teal)] transition-all duration-300"
                    style={{
                      width: `${((questionIndex + 1) / questionsList.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Question Prompt */}
              <div className="py-4">
                <span className="text-xs font-bold text-[var(--red)] uppercase tracking-wider block mb-1">
                  คำถาม ({activeLevel.title})
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[var(--ink)] leading-snug">
                  {currentQuestion.prompt}
                </h2>
              </div>

              {/* Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentQuestion.choices.map((choice, i) => {
                  const isSelected = selectedAnswer === choice;
                  const isCorrect = choice === currentQuestion.answer;
                  let btnStyle =
                    "bg-white border-[var(--line)] text-[var(--ink)] hover:border-black/40";

                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      btnStyle = "bg-green-100 border-green-500 text-green-900 font-black";
                    } else if (isSelected && !isCorrect) {
                      btnStyle = "bg-red-100 border-red-500 text-red-900 font-bold";
                    } else {
                      btnStyle = "bg-gray-50 border-gray-200 text-gray-400 opacity-60";
                    }
                  } else if (isSelected) {
                    btnStyle = "border-[var(--ink)] bg-gray-100";
                  }

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={isAnswerSubmitted}
                      onClick={() => handleChooseAnswer(choice)}
                      className={`p-4 rounded-2xl border text-left text-base font-bold transition-all shadow-xs flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{choice}</span>
                      {isAnswerSubmitted && isCorrect && <span className="text-xs font-bold text-green-800">ถูกต้อง</span>}
                      {isAnswerSubmitted && isSelected && !isCorrect && <span className="text-xs font-bold text-red-800">ยังไม่ถูก</span>}
                    </button>
                  );
                })}
              </div>

              {/* Feedback and Explanation */}
              {isAnswerSubmitted && (
                <div
                  className={`p-5 rounded-2xl border text-sm space-y-2 animate-fadeIn ${
                    selectedAnswer === currentQuestion.answer
                      ? "bg-green-50/80 border-green-200 text-green-950"
                      : "bg-red-50/80 border-red-200 text-red-950"
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-base">
                    <span>
                      {selectedAnswer === currentQuestion.answer
                        ? "ถูกต้องแล้ว"
                        : "ยังไม่ถูกต้อง"}
                    </span>
                  </div>
                  {currentQuestion.explanation && (
                    <p className="text-xs leading-relaxed opacity-90">
                      <strong>คำอธิบาย:</strong> {currentQuestion.explanation}
                    </p>
                  )}
                  {saveStatus === "saving" && (
                    <span className="text-[11px] opacity-70 block">
                      กำลังบันทึกคะแนน...
                    </span>
                  )}
                  {saveStatus === "saved" && (
                    <span className="text-[11px] opacity-70 block">
                      บันทึกสถิติลงระบบเรียบร้อย
                    </span>
                  )}
                </div>
              )}

              {/* Next Action Button */}
              {isAnswerSubmitted && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="px-6 py-3 bg-[var(--ink)] hover:bg-black text-white font-bold text-sm rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-2"
                  >
                    <span>
                      {questionIndex + 1 < questionsList.length
                        ? "ข้อถัดไป"
                        : "ดูผลคะแนนรวม"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Quiz Completed Result Screen */
            <div className="p-8 sm:p-12 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xl text-center space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">
                  ทำแบบทดสอบ {activeLevel.title} เสร็จสิ้น
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-[var(--ink)]">
                  คะแนนของคุณ: {score} / {questionsList.length}
                </h2>
                <p className="text-base text-[var(--muted)] font-medium max-w-md mx-auto">
                  {score === questionsList.length
                    ? "ยอดเยี่ยมมาก คุณทำถูกต้องครบทุกข้อ พร้อมลุยระดับถัดไปแล้ว"
                    : score >= questionsList.length / 2
                    ? "ทำได้ดีมาก ลองทบทวนจุดที่ผิดและฝึกซ้ำอีกรอบเพื่อความแม่นยำ"
                    : "กลับไปทบทวนบัตรคำและบทเรียน แล้วลองทำใหม่อีกครั้งนะ"}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="px-6 py-3 rounded-xl bg-[var(--ink)] hover:bg-black text-white font-bold text-sm shadow-md transition-transform active:scale-95"
                >
                  ทำแบบทดสอบชุดนี้ใหม่
                </button>
                <Link
                  href="/vocabulary"
                  className="px-6 py-3 rounded-xl bg-white border border-[var(--line)] hover:bg-gray-50 text-[var(--ink)] font-bold text-sm shadow-xs transition-transform active:scale-95"
                >
                  ไปทบทวนบัตรคำศัพท์
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
