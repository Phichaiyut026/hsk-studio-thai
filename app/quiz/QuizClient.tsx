"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { hskLevels, type Level, type QuizItem } from "../../lib/hsk-data";

type QuizStats = {
  totalAttempts: number;
  correctAttempts: number;
};

type ProgressStats = {
  levels: Array<{
    levelId: string;
    totalQuestions: number;
    totalAttempts: number;
    correctAttempts: number;
    accuracyPercent: number;
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
  isAdmin: boolean;
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

export default function QuizClient({ authPaths, user, isAdmin }: Props) {
  const [levels, setLevels] = useState<Level[]>(hskLevels);
  const [selectedLevelId, setSelectedLevelId] = useState<string>("hsk1");
  const [selectedExamId, setSelectedExamId] = useState("all");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(30 * 60);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [progress, setProgress] = useState<ProgressStats | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "offline">("idle");

  const activeLevel = useMemo(() => {
    return levels.find((l) => l.id === selectedLevelId) || levels[0] || hskLevels[0];
  }, [levels, selectedLevelId]);

  const allQuestions: QuizItem[] = useMemo(() => {
    return activeLevel.quizzes && activeLevel.quizzes.length > 0
      ? activeLevel.quizzes
      : [activeLevel.quiz];
  }, [activeLevel]);

  const examSets = useMemo(() => {
    const sets = new Map<string, QuizItem[]>();
    allQuestions.forEach((question) => {
      const key = question.documentId ?? "H11329";
      sets.set(key, [...(sets.get(key) ?? []), question]);
    });
    return Array.from(sets.entries()).map(([id, questions]) => ({ id, questions }));
  }, [allQuestions]);

  const questionsList = useMemo(() => {
    if (selectedExamId === "all") return allQuestions;
    return examSets.find((exam) => exam.id === selectedExamId)?.questions ?? allQuestions;
  }, [allQuestions, examSets, selectedExamId]);

  const currentQuestion = questionsList[questionIndex] || questionsList[0];

  const sectionAudioUrl = useMemo(() => {
    if (!currentQuestion || currentQuestion.part !== "listening") return "";
    return questionsList.find((question) =>
      question.part === "listening" &&
      question.documentId === currentQuestion.documentId &&
      question.mediaUrl,
    )?.mediaUrl ?? "";
  }, [currentQuestion, questionsList]);

  const shuffledChoices = useMemo(() => {
    const choices = currentQuestion?.choices ?? [];
    const ordered = choices
      .map((choice, index) => ({
        choice,
        order: Array.from(`${currentQuestion.id}:${choice}:${index}`).reduce(
          (total, character) => (total * 31 + character.charCodeAt(0)) % 997,
          7,
        ),
      }))
      .sort((left, right) => left.order - right.order)
      .map((item) => item.choice);
    if (ordered.length > 1 && ordered[0] === currentQuestion.answer) {
      ordered.push(ordered.shift() as string);
    }
    return ordered;
  }, [currentQuestion]);

  const answeredCount = Object.keys(answers).length;
  const timeLabel = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(
    remainingSeconds % 60,
  ).padStart(2, "0")}`;

  useEffect(() => {
    const levelFromUrl = new URLSearchParams(window.location.search).get("level");
    if (levelFromUrl) {
      setSelectedLevelId(levelFromUrl);
    }
  }, []);

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
          if (!data.levels.some((level) => level.id === selectedLevelId)) {
            setSelectedLevelId(data.levels[0].id);
          }
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
  }, [selectedLevelId]);

  useEffect(() => {
    if (!examStarted || isFinished) return;
    if (remainingSeconds <= 0) {
      void handleFinishExam();
      return;
    }
    const timer = window.setInterval(() => setRemainingSeconds((seconds) => seconds - 1), 1000);
    return () => window.clearInterval(timer);
  }, [examStarted, isFinished, remainingSeconds]);

  function handleSelectLevel(levelId: string) {
    setSelectedLevelId(levelId);
    setSelectedExamId("all");
    setQuestionIndex(0);
    setSelectedAnswer("");
    setIsAnswerSubmitted(false);
    setAnswers({});
    setScore(0);
    setIsFinished(false);
    setExamStarted(false);
    setRemainingSeconds(30 * 60);
    setSaveStatus("idle");
  }

  function handleStartExam() {
    setExamStarted(true);
    setRemainingSeconds(30 * 60);
  }

  function handleChooseAnswer(choice: string) {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(choice);
    setIsAnswerSubmitted(true);
    setAnswers((previous) => ({ ...previous, [questionIndex]: choice }));
  }

  function handleNextQuestion() {
    if (questionIndex + 1 < questionsList.length) {
      setQuestionIndex((prev) => prev + 1);
      setSelectedAnswer("");
      setIsAnswerSubmitted(false);
      setSelectedAnswer(answers[questionIndex + 1] || "");
    } else {
      void handleFinishExam();
    }
  }

  async function handleFinishExam() {
    if (isSubmittingExam || isFinished) return;
    const finalAnswers = selectedAnswer
      ? { ...answers, [questionIndex]: selectedAnswer }
      : answers;
    const finalScore = questionsList.reduce(
      (total, question, index) => total + (finalAnswers[index] === question.answer ? 1 : 0),
      0,
    );
    setAnswers(finalAnswers);
    setScore(finalScore);
    setIsSubmittingExam(true);
    setSaveStatus("saving");

    try {
      const responses = await Promise.all(
        Object.entries(finalAnswers).map(([index, choice]) =>
          fetch("/api/quiz-attempts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: getSessionId(),
              levelId: activeLevel.id,
              questionId: questionsList[Number(index)]?.id,
              selectedAnswer: choice,
            }),
          }),
        ),
      );
      const lastSuccessful = responses.find((response) => response.ok);
      if (lastSuccessful) {
        const data = (await lastSuccessful.json()) as { stats?: QuizStats; progress?: ProgressStats };
        if (data.stats) setQuizStats(data.stats);
        if (data.progress) setProgress(data.progress);
        setSaveStatus("saved");
      } else if (responses.length > 0) {
        throw new Error("Could not save exam attempts");
      } else {
        setSaveStatus("saved");
      }
    } catch {
      setSaveStatus("offline");
    } finally {
      setIsSubmittingExam(false);
      setIsFinished(true);
    }
  }

  function handleRestart() {
    setQuestionIndex(0);
    setSelectedAnswer("");
    setIsAnswerSubmitted(false);
    setAnswers({});
    setScore(0);
    setIsFinished(false);
    setExamStarted(true);
    setRemainingSeconds(30 * 60);
    setSaveStatus("idle");
  }

  return (
    <div className={`app-page quiz-page min-h-screen text-[var(--ink)] flex flex-col justify-between ${examStarted && !isFinished ? "quiz-live" : ""}`}>
      <div>
        <Navbar authPaths={authPaths} user={user} isAdmin={isAdmin} />

        <main className="quiz-main max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="quiz-page-header mb-8 text-center sm:text-left">
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
          <div className="quiz-level-tabs flex flex-wrap gap-2 mb-8">
            {levels.map((lvl) => {
              const levelProgress = progress?.levels.find((item) => item.levelId === lvl.id);
              return (
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
                <span>{lvl.title} Mock Exam</span>
                {levelProgress && levelProgress.totalAttempts > 0 && (
                  <span className="ml-2 opacity-70">
                    {levelProgress.accuracyPercent}%
                  </span>
                )}
              </button>
            )})}
          </div>

          {!examStarted && !isFinished ? (
            <div className="quiz-start-screen p-6 sm:p-10 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-lg">
              <div className="max-w-2xl mx-auto text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-[var(--ink)] text-white grid place-items-center text-2xl font-black">试</div>
                <div>
                  <span className="text-xs font-black tracking-widest text-[var(--red)] uppercase">Mock Examination</span>
                  <h2 className="text-3xl sm:text-4xl font-black mt-2">{activeLevel.title} 模拟考试</h2>
                  <p className="text-[var(--muted)] mt-3">จำลองบรรยากาศการสอบจริง ทำข้อสอบให้ครบก่อนส่ง และจะเห็นเฉลยพร้อมคะแนนหลังจบเท่านั้น</p>
                </div>
                <label className="quiz-exam-selector">
                  <span>เลือกชุดข้อสอบ</span>
                  <select value={selectedExamId} onChange={(event) => setSelectedExamId(event.target.value)}>
                    <option value="all">รวมทุกชุดข้อสอบ ({allQuestions.length} ข้อ)</option>
                    {examSets.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        ชุด {exam.id} ({exam.questions.length} ข้อ)
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                  {[
                    ["จำนวนข้อ", `${questionsList.length} ข้อ`],
                    ["เวลา", "30 นาที"],
                    ["รูปแบบ", "เลือกตอบ"],
                    ["สถานะ", "พร้อมสอบ"],
                  ].map(([label, value]) => <div key={label} className="p-3 rounded-xl border border-[var(--line)] bg-white"><span className="block text-[11px] text-[var(--muted)] font-bold">{label}</span><strong className="block mt-1 text-sm">{value}</strong></div>)}
                </div>
                <div className="text-left p-4 rounded-xl bg-[#f5f1e8] border border-[#e4dccd] text-sm leading-relaxed">
                  <strong>คำแนะนำก่อนเริ่มสอบ</strong>
                  <ul className="mt-2 list-disc pl-5 text-[var(--muted)]"><li>เลือกคำตอบได้ครั้งเดียวต่อข้อ และไปข้อถัดไปได้เมื่อเลือกแล้ว</li><li>ใช้แถบเลขข้อเพื่อตรวจดูข้อที่ทำแล้ว</li><li>เมื่อหมดเวลาระบบจะส่งข้อสอบให้อัตโนมัติ</li></ul>
                </div>
                <button type="button" onClick={handleStartExam} className="px-8 py-3 rounded-xl bg-[var(--ink)] text-white font-black shadow-md hover:bg-black">เริ่มทำข้อสอบ</button>
              </div>
            </div>
          ) : !isFinished ? (
            /* Quiz In Progress */
            <div className="quiz-session space-y-4">
              <div className="quiz-session-bar flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-[var(--ink)] text-white shadow-md">
                <div><span className="text-[10px] uppercase tracking-widest opacity-60">{currentQuestion.documentId ?? "H11329"} · Mock Examination</span><strong className="block text-lg">{activeLevel.title} · {currentQuestion.part === "listening" ? "听力 ฟัง" : currentQuestion.part === "writing" ? "书写 เขียน" : "阅读 อ่าน"} · ส่วนที่ {currentQuestion.section ?? "1"}</strong></div>
                <div className={`font-mono text-xl font-black ${remainingSeconds < 300 ? "text-red-300" : "text-amber-200"}`}>เวลาเหลือ {timeLabel}</div>
              </div>
              <div className="quiz-session-layout grid lg:grid-cols-[minmax(0,1fr)_210px] gap-4 items-start">
              <div className="quiz-question-card p-6 sm:p-10 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-lg space-y-6">
              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[var(--muted)] mb-2">
                  <span>
                    ข้อที่ {questionIndex + 1} จาก {questionsList.length}
                  </span>
                  <span>ทำแล้ว {answeredCount} / {questionsList.length} ข้อ</span>
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
                  ข้อ {currentQuestion.questionNumber ?? questionIndex + 1} · {currentQuestion.format ?? "choice"} ({activeLevel.title})
                </span>
                {sectionAudioUrl && (
                  <audio controls preload="metadata" src={sectionAudioUrl} className="quiz-audio-player mb-4">เบราว์เซอร์นี้ไม่รองรับการเล่นเสียง</audio>
                )}
                {(currentQuestion.imageUrl || (currentQuestion.mediaUrl && currentQuestion.part !== "listening")) && (
                  <img src={currentQuestion.imageUrl || currentQuestion.mediaUrl} alt="ภาพประกอบข้อสอบ" className="max-h-48 max-w-full object-contain rounded-lg border border-[var(--line)] mb-4" />
                )}
                <h2 className="text-xl sm:text-2xl font-black text-[var(--ink)] leading-snug">
                  {currentQuestion.prompt}
                </h2>
              </div>

              {/* Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {shuffledChoices.map((choice, i) => {
                  const isSelected = selectedAnswer === choice;
                  const btnStyle = isSelected
                    ? "border-[var(--ink)] bg-[#e9f1ef] text-[var(--ink)] ring-2 ring-[var(--teal)]/30"
                    : "bg-white border-[var(--line)] text-[var(--ink)] hover:border-black/40";

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={isAnswerSubmitted}
                      onClick={() => handleChooseAnswer(choice)}
                      className={`p-4 rounded-2xl border text-left text-base font-bold transition-all shadow-xs flex items-center justify-between ${btnStyle}`}
                    >
                      <span className="flex items-center gap-3">{(currentQuestion.format === "image-choice" || (currentQuestion.part === "listening" && currentQuestion.format === "matching")) && (() => { try { const urls = JSON.parse(currentQuestion.imageUrl || "[]") as string[]; return urls[currentQuestion.choices.indexOf(choice)] ? <img src={urls[currentQuestion.choices.indexOf(choice)]} alt={`ตัวเลือก ${choice}`} className="h-24 w-24 object-contain rounded-lg border border-[var(--line)]" /> : null; } catch { return null; } })()}<span>{choice}</span></span>
                      {isSelected && <span className="text-xs font-bold text-[var(--teal)]">คำตอบของคุณ</span>}
                    </button>
                  );
                })}
              </div>

              {/* Feedback and Explanation */}
              {isAnswerSubmitted && <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-950 text-sm">บันทึกคำตอบแล้ว สามารถไปข้อถัดไปได้</div>}
              <div className="text-center text-[10px] tracking-widest text-[var(--muted)] pt-1">{currentQuestion.documentId ?? "H11329"} - {currentQuestion.questionNumber ?? questionIndex + 1}</div>

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
              <aside className="quiz-answer-sheet p-4 rounded-2xl bg-[var(--paper)] border border-[var(--line)] shadow-sm lg:sticky lg:top-4">
                <div className="flex items-center justify-between mb-3"><strong className="text-sm">กระดาษคำตอบ</strong><span className="text-xs text-[var(--muted)]">{answeredCount}/{questionsList.length}</span></div>
                <div className="grid grid-cols-5 gap-2">{questionsList.map((_, index) => <button key={index} type="button" onClick={() => { setQuestionIndex(index); setSelectedAnswer(answers[index] || ""); setIsAnswerSubmitted(Boolean(answers[index])); }} className={`aspect-square rounded-lg text-xs font-black border ${index === questionIndex ? "bg-[var(--ink)] text-white border-[var(--ink)]" : answers[index] ? "bg-teal-50 text-teal-900 border-teal-300" : "bg-white text-[var(--muted)] border-[var(--line)]"}`}>{index + 1}</button>)}</div>
                <div className="mt-4 space-y-2 text-xs text-[var(--muted)]"><p><span className="inline-block w-2.5 h-2.5 rounded-sm bg-teal-100 border border-teal-300 mr-2" />ตอบแล้ว</p><p><span className="inline-block w-2.5 h-2.5 rounded-sm bg-white border border-[var(--line)] mr-2" />ยังไม่ได้ตอบ</p></div>
                <button type="button" onClick={() => void handleFinishExam()} disabled={isSubmittingExam} className="w-full mt-4 px-3 py-3 rounded-xl bg-[var(--red)] text-white text-sm font-black disabled:opacity-50">ส่งคำตอบทั้งหมด</button>
              </aside>
              </div>
            </div>
          ) : (
            /* Quiz Completed Result Screen */
            <div className="quiz-result-screen p-8 sm:p-12 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xl text-center space-y-6">
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
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f5f1e8] text-xs font-bold text-[var(--muted)]">
                  {saveStatus === "saved" ? "บันทึกผลสอบลงระบบแล้ว" : "ไม่สามารถบันทึกผลสอบได้ ระบบแสดงผลจากเครื่องนี้"}
                </div>
              </div>

              <div className="text-left max-w-2xl mx-auto border-t border-[var(--line)] pt-5">
                <h3 className="font-black text-sm mb-3">ตรวจคำตอบหลังสอบ</h3>
                <div className="space-y-2 max-h-72 overflow-auto pr-1">
                  {questionsList.map((question, index) => {
                    const answer = answers[index];
                    const correct = answer === question.answer;
                    return <div key={question.id} className={`flex gap-3 items-start p-3 rounded-lg text-sm ${correct ? "bg-green-50" : "bg-red-50"}`}><span className="font-black w-6">{index + 1}</span><div className="min-w-0"><p className="font-bold">{question.prompt}</p><p className="text-xs mt-1 text-[var(--muted)]">คำตอบของคุณ: {answer || "ไม่ได้ตอบ"} · เฉลย: {question.answer}</p></div></div>;
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="px-6 py-3 rounded-xl bg-[var(--ink)] hover:bg-black text-white font-bold text-sm shadow-md transition-transform active:scale-95"
                >
                  ทำแบบทดสอบชุดนี้ใหม่
                </button>
                <a
                  href="/vocabulary"
                  className="px-6 py-3 rounded-xl bg-white border border-[var(--line)] hover:bg-gray-50 text-[var(--ink)] font-bold text-sm shadow-xs transition-transform active:scale-95"
                >
                  ไปทบทวนบัตรคำศัพท์
                </a>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer isAdmin={isAdmin} />
    </div>
  );
}
