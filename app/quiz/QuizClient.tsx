"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { AnswerSheet, ExamSectionPaper, type AnswerSheetSection, type ExamQuestion } from "../components/exam/ExamPaper";
import { getLevelSpec, partNames, sectionTitleZh, type ExamPart } from "../../lib/hsk-exam-format";

type QuizItem = ExamQuestion & {
  levelId: string;
  documentId?: string;
  part?: ExamPart;
  section?: string;
};

type Level = {
  id: string;
  title: string;
};

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

type PaperSection = Omit<AnswerSheetSection, "questions"> & { documentId: string; questions: QuizItem[] };

const partOrder: Record<string, number> = { listening: 0, reading: 1, writing: 2 };
const ALL_SETS = "all";

function getSessionId() {
  if (typeof window === "undefined") return "";
  const key = "hsk-studio-session-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const next = crypto.randomUUID();
  window.localStorage.setItem(key, next);
  return next;
}

// Exam sets without a document ID default to H{level}1329. Older non-HSK1 rows were
// saved with the HSK1 default "H11329", so treat that as unset outside HSK1 as well.
function resolveDocumentId(question: QuizItem, fallbackLevelId?: string) {
  const levelId = question.levelId || fallbackLevelId || "hsk1";
  if (question.documentId && (levelId === "hsk1" || question.documentId !== "H11329")) return question.documentId;
  return `H${levelId.replace(/\D/g, "") || "1"}1329`;
}

function buildSections(questions: QuizItem[], levelId: string): PaperSection[] {
  const sections = new Map<string, PaperSection>();
  for (const question of questions) {
    const documentId = resolveDocumentId(question, levelId);
    const part = question.part ?? "reading";
    const section = question.section ?? "1";
    const key = `${documentId}::${part}::${section}`;
    const current = sections.get(key) ?? { key, documentId, part, section, questions: [] };
    current.questions.push(question);
    sections.set(key, current);
  }
  return Array.from(sections.values())
    .map((section) => ({
      ...section,
      questions: [...section.questions].sort((left, right) => Number(Boolean(right.isExample)) - Number(Boolean(left.isExample)) || (left.questionNumber ?? 0) - (right.questionNumber ?? 0)),
    }))
    .sort((left, right) =>
      left.documentId.localeCompare(right.documentId) ||
      (partOrder[left.part] ?? 9) - (partOrder[right.part] ?? 9) ||
      left.section.localeCompare(right.section, undefined, { numeric: true }),
    );
}

function formatClock(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function QuizClient({ authPaths, user, isAdmin }: Props) {
  const [levels, setLevels] = useState<Level[]>([]);
  const [questions, setQuestions] = useState<QuizItem[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<string>("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sectionIndex, setSectionIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(30 * 60);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [progress, setProgress] = useState<ProgressStats | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "offline">("idle");

  const activeLevel = useMemo(() => {
    return levels.find((l) => l.id === selectedLevelId) || levels[0];
  }, [levels, selectedLevelId]);

  const levelSpec = activeLevel ? getLevelSpec(activeLevel.id) : undefined;
  const examMinutes = levelSpec?.minutes ?? 30;

  const levelQuestions = useMemo(() => {
    if (!activeLevel) return [];
    return questions.filter((question) => question.levelId === activeLevel.id);
  }, [activeLevel, questions]);

  const examSets = useMemo(() => {
    const sets = new Map<string, number>();
    levelQuestions.forEach((question) => {
      if (question.isExample) return;
      const key = resolveDocumentId(question, activeLevel?.id);
      sets.set(key, (sets.get(key) ?? 0) + 1);
    });
    return Array.from(sets.entries()).map(([id, count]) => ({ id, count })).sort((left, right) => left.id.localeCompare(right.id));
  }, [levelQuestions, activeLevel]);

  // A real exam is a single paper, so default to the first set instead of mixing sets.
  const examId = selectedExamId === ALL_SETS || examSets.some((exam) => exam.id === selectedExamId) ? selectedExamId : examSets[0]?.id ?? "";

  const sections = useMemo(() => {
    if (!activeLevel) return [];
    const paper = examId === ALL_SETS ? levelQuestions : levelQuestions.filter((question) => resolveDocumentId(question, activeLevel.id) === examId);
    return buildSections(paper, activeLevel.id);
  }, [activeLevel, examId, levelQuestions]);

  const scoredQuestions = useMemo(() => sections.flatMap((section) => section.questions.filter((question) => !question.isExample)), [sections]);
  const currentSection = sections[Math.min(sectionIndex, Math.max(sections.length - 1, 0))];
  const answeredCount = scoredQuestions.filter((question) => answers[question.id]).length;
  const score = scoredQuestions.filter((question) => answers[question.id] === question.answer).length;

  const partSummary = useMemo(() => {
    const parts = new Map<string, { total: number; correct: number }>();
    for (const question of scoredQuestions) {
      const part = question.part ?? "reading";
      const current = parts.get(part) ?? { total: 0, correct: 0 };
      current.total += 1;
      if (answers[question.id] === question.answer) current.correct += 1;
      parts.set(part, current);
    }
    return Array.from(parts.entries())
      .sort(([left], [right]) => (partOrder[left] ?? 9) - (partOrder[right] ?? 9))
      .map(([part, value]) => ({ part, ...value, scaled: Math.round((value.correct / value.total) * 100) }));
  }, [answers, scoredQuestions]);

  const totalScaled = partSummary.reduce((total, part) => total + part.scaled, 0);
  const maxScaled = partSummary.length * 100;
  // HSK passes at 60% of the total (120/200 for levels 1-2, 180/300 for levels 3-6).
  const passed = maxScaled > 0 && totalScaled >= maxScaled * 0.6;

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
        const data = (await res.json()) as { levels?: Level[]; questions?: QuizItem[]; stats?: QuizStats; progress?: ProgressStats };
        const nextQuestions = data.questions?.filter((question) => question.id && question.answer) ?? [];
        if (!ignore) setQuestions(nextQuestions);
        if (!ignore && data.levels && data.levels.length > 0) {
          setLevels(data.levels);
          if (!selectedLevelId) {
            const availableExamLevel = data.levels.find((level) => nextQuestions.some((question) => question.levelId === level.id && !question.isExample));
            if (availableExamLevel) {
              setSelectedLevelId(availableExamLevel.id);
            }
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

  function resetExam() {
    setAnswers({});
    setSectionIndex(0);
    setIsFinished(false);
    setRemainingSeconds(examMinutes * 60);
    setSaveStatus("idle");
  }

  function handleSelectLevel(levelId: string) {
    setSelectedLevelId(levelId);
    setSelectedExamId("");
    setExamStarted(false);
    resetExam();
  }

  function handleStartExam() {
    resetExam();
    setExamStarted(true);
    window.scrollTo({ top: 0 });
  }

  function goToSection(index: number) {
    setSectionIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleAnswer(questionId: string, choice: string) {
    setAnswers((previous) => ({ ...previous, [questionId]: choice }));
  }

  function confirmAndFinish() {
    const unanswered = scoredQuestions.length - answeredCount;
    if (unanswered > 0 && !window.confirm(`ยังไม่ได้ตอบอีก ${unanswered} ข้อ ต้องการส่งข้อสอบเลยหรือไม่?`)) return;
    void handleFinishExam();
  }

  async function handleFinishExam() {
    if (isSubmittingExam || isFinished) return;
    setIsSubmittingExam(true);
    setSaveStatus("saving");

    try {
      const answered = scoredQuestions.filter((question) => answers[question.id]);
      const responses = await Promise.all(
        answered.map((question) =>
          fetch("/api/quiz-attempts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: getSessionId(),
              levelId: activeLevel.id,
              questionId: question.id,
              selectedAnswer: answers[question.id],
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (!activeLevel) {
    return (
      <div className="app-page quiz-page min-h-screen text-[var(--ink)] flex flex-col justify-between">
        <div>
          <Navbar authPaths={authPaths} user={user} isAdmin={isAdmin} />
          <main className="quiz-main max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <section className="exam-paper exam-cover">
              <p className="exam-cover-kicker">新汉语水平考试</p>
              <h1 className="exam-cover-title">HSK</h1>
              <p className="text-[var(--muted)] text-base mt-4">ยังไม่มีชุดข้อสอบ เพิ่มข้อสอบจากหน้า Admin ก่อน แล้วระดับและชุดข้อสอบจะแสดงในหน้านี้อัตโนมัติ</p>
            </section>
          </main>
        </div>
        <Footer isAdmin={isAdmin} />
      </div>
    );
  }

  const inSession = examStarted && !isFinished;
  const titleZh = levelSpec?.titleZh ?? activeLevel.title;
  const paperCode = examId === ALL_SETS ? "รวมทุกชุด" : examId;
  const expectedTotal = levelSpec?.parts.reduce((total, part) => total + part.questions, 0);

  return (
    <div className={`app-page quiz-page min-h-screen text-[var(--ink)] flex flex-col justify-between ${inSession ? "quiz-live" : ""}`}>
      <div>
        <Navbar authPaths={authPaths} user={user} isAdmin={isAdmin} />

        <main className="quiz-main max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!inSession && (
            <>
              <div className="quiz-page-header mb-6 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div>
                    <span className="text-xs font-black tracking-widest text-[var(--red)]">模拟考试 · ข้อสอบจำลอง</span>
                    <h1 className="text-3xl sm:text-4xl font-black text-[var(--ink)] mt-1">ศูนย์สอบจำลอง HSK</h1>
                    <p className="text-[var(--muted)] text-base mt-1">รูปแบบข้อสอบ ลำดับส่วน และเวลาเหมือนสนามสอบจริง</p>
                  </div>
                  {quizStats && quizStats.totalAttempts > 0 && (
                    <div className="p-3 bg-white rounded-lg border border-[var(--line)] text-center">
                      <span className="text-xs font-bold text-[var(--muted)] block">สถิติรวมของคุณ</span>
                      <span className="text-lg font-black text-[var(--teal)]">
                        {quizStats.correctAttempts} / {quizStats.totalAttempts} ข้อถูก ({Math.round((quizStats.correctAttempts / (quizStats.totalAttempts || 1)) * 100)}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="quiz-level-tabs flex flex-wrap gap-2 mb-8">
                {levels.map((lvl) => {
                  const levelProgress = progress?.levels.find((item) => item.levelId === lvl.id);
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => handleSelectLevel(lvl.id)}
                      className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-all border ${
                        activeLevel.id === lvl.id
                          ? "bg-[#16324f] text-white border-[#16324f] shadow-md"
                          : "bg-[var(--paper)] text-[var(--ink)] border-[var(--line)] hover:border-black/30"
                      }`}
                    >
                      <span>{lvl.title}</span>
                      {levelProgress && levelProgress.totalAttempts > 0 && <span className="ml-2 opacity-70">{levelProgress.accuracyPercent}%</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {!examStarted && !isFinished ? (
            /* Cover page, modelled on the front page of the HSK booklet */
            <section className="exam-paper exam-cover">
              <p className="exam-cover-kicker">新汉语水平考试</p>
              <h2 className="exam-cover-title">{titleZh}</h2>
              <p className="exam-cover-code">{scoredQuestions.length ? paperCode : "—"}</p>

              <label className="quiz-exam-selector">
                <span>เลือกชุดข้อสอบ</span>
                <select value={examId} onChange={(event) => setSelectedExamId(event.target.value)} disabled={examSets.length === 0}>
                  {examSets.length === 0 ? (
                    <option value="">ยังไม่มีชุดข้อสอบในระดับนี้</option>
                  ) : (
                    <>
                      {examSets.map((exam) => (
                        <option key={exam.id} value={exam.id}>
                          ชุด {exam.id} ({exam.count} ข้อ)
                        </option>
                      ))}
                      {examSets.length > 1 && <option value={ALL_SETS}>ฝึกรวมทุกชุด ({examSets.reduce((total, exam) => total + exam.count, 0)} ข้อ)</option>}
                    </>
                  )}
                </select>
              </label>

              <div className="exam-notice">
                <h3>注 意</h3>
                <ol>
                  {levelSpec ? (
                    <li>
                      {titleZh}分{["", "一", "两", "三"][levelSpec.parts.length] ?? levelSpec.parts.length}部分：
                      {levelSpec.parts.map((part, index) => (
                        <span key={part.part} className="block pl-4">
                          {index + 1}. {partNames[part.part].zh}（{part.questions}题，{part.minutes}）
                        </span>
                      ))}
                    </li>
                  ) : (
                    <li>ข้อสอบชุดนี้แบ่งตามพาร์ทและส่วนที่แอดมินกำหนด</li>
                  )}
                  <li>全部考试约{examMinutes}分钟。<small> · เวลาสอบ {examMinutes} นาที หมดเวลาระบบส่งให้อัตโนมัติ</small></li>
                  <li>
                    ชุดนี้มี {scoredQuestions.length} ข้อใน {sections.length} ส่วน
                    {expectedTotal && scoredQuestions.length < expectedTotal ? <small> (ข้อสอบจริงมี {expectedTotal} ข้อ ชุดนี้ยังเพิ่มไม่ครบ)</small> : null}
                  </li>
                  <li>
                    ตอบโดยกด ✓ / ✗ หรือตัวอักษร A–F เปลี่ยนคำตอบได้จนกว่าจะส่ง ข้อ “例如” คือตัวอย่าง ไม่คิดคะแนน
                  </li>
                </ol>
              </div>

              <button
                type="button"
                onClick={handleStartExam}
                disabled={scoredQuestions.length === 0}
                className="px-8 py-3 rounded-md bg-[#16324f] text-white font-black shadow-md hover:bg-[#0f2338] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {scoredQuestions.length === 0 ? "ยังไม่มีข้อสอบในระดับนี้" : "开始考试 · เริ่มสอบ"}
              </button>
            </section>
          ) : inSession && currentSection ? (
            <div className="quiz-session">
              <div className="exam-topbar">
                <div>
                  <small>{paperCode} · 考生 {user?.displayName ?? "ผู้สอบ"}</small>
                  <strong>{titleZh} · {partNames[currentSection.part as ExamPart]?.zh ?? currentSection.part} {sectionTitleZh(currentSection.section)}</strong>
                </div>
                <div className={`exam-timer ${remainingSeconds < 300 ? "is-low" : ""}`} aria-label="เวลาที่เหลือ">{formatClock(Math.max(remainingSeconds, 0))}</div>
                <button type="button" className="exam-submit-button" onClick={confirmAndFinish} disabled={isSubmittingExam}>
                  {isSubmittingExam ? "กำลังส่ง..." : `交卷 ส่งข้อสอบ (${answeredCount}/${scoredQuestions.length})`}
                </button>
              </div>

              <nav className="exam-section-tabs" aria-label="ส่วนของข้อสอบ">
                {sections.map((section, index) => {
                  const scored = section.questions.filter((question) => !question.isExample);
                  const done = scored.length > 0 && scored.every((question) => answers[question.id]);
                  return (
                    <button key={section.key} type="button" onClick={() => goToSection(index)} className={`${index === sectionIndex ? "is-current" : ""} ${done ? "is-done" : ""}`}>
                      {examId === ALL_SETS ? `${section.documentId} · ` : ""}{partNames[section.part as ExamPart]?.zh ?? section.part} {sectionTitleZh(section.section).replace(/[第部分]/g, "")}
                    </button>
                  );
                })}
              </nav>

              <div className="exam-layout">
                <div>
                  <ExamSectionPaper
                    key={currentSection.key}
                    levelId={activeLevel.id}
                    part={currentSection.part}
                    section={currentSection.section}
                    questions={currentSection.questions}
                    answers={answers}
                    onAnswer={handleAnswer}
                  />
                  <div className="exam-pager">
                    <button type="button" onClick={() => goToSection(sectionIndex - 1)} disabled={sectionIndex === 0}>← ส่วนก่อนหน้า</button>
                    {sectionIndex + 1 < sections.length ? (
                      <button type="button" className="is-primary" onClick={() => goToSection(sectionIndex + 1)}>ส่วนถัดไป →</button>
                    ) : (
                      <button type="button" className="is-primary" onClick={confirmAndFinish} disabled={isSubmittingExam}>交卷 ส่งข้อสอบ</button>
                    )}
                  </div>
                </div>
                <aside>
                  <div className="exam-aside-title"><span>答题卡 กระดาษคำตอบ</span><span>{answeredCount}/{scoredQuestions.length}</span></div>
                  <AnswerSheet sections={sections} answers={answers} currentKey={currentSection.key} onJump={(key) => goToSection(sections.findIndex((section) => section.key === key))} />
                </aside>
              </div>
            </div>
          ) : (
            /* Score report + full answer review on the same paper layout */
            <div className="space-y-6">
              <section className="exam-paper exam-cover">
                <p className="exam-cover-kicker">成绩报告 · ผลสอบ</p>
                <h2 className="exam-cover-title">{titleZh}</h2>
                <p className="exam-cover-code">{paperCode}</p>
                <table className="exam-report-table">
                  <thead><tr><th>部分</th><th>ตอบถูก</th><th>คะแนน</th></tr></thead>
                  <tbody>
                    {partSummary.map((part) => (
                      <tr key={part.part}><td>{partNames[part.part as ExamPart]?.zh ?? part.part} · {partNames[part.part as ExamPart]?.th ?? ""}</td><td>{part.correct} / {part.total}</td><td>{part.scaled} / 100</td></tr>
                    ))}
                  </tbody>
                  <tfoot><tr><td>总分 รวม</td><td>{score} / {scoredQuestions.length}</td><td>{totalScaled} / {maxScaled}</td></tr></tfoot>
                </table>
                <span className={`exam-pass-badge ${passed ? "is-pass" : "is-fail"}`}>{passed ? "合格 ผ่านเกณฑ์" : "不合格 ยังไม่ผ่านเกณฑ์"}</span>
                <p className="text-sm text-[var(--muted)] mt-4">เกณฑ์ผ่าน {Math.round(maxScaled * 0.6)} จาก {maxScaled} คะแนน (60%) · คะแนนแต่ละพาร์ทคิดเป็นเต็ม 100 แบบสนามจริง</p>
                <p className="inline-block mt-3 px-3 py-2 rounded bg-[#f5f1e8] text-xs font-bold text-[var(--muted)]">
                  {saveStatus === "saved" ? "บันทึกผลสอบลงระบบแล้ว" : saveStatus === "saving" ? "กำลังบันทึกผลสอบ..." : "ไม่สามารถบันทึกผลสอบได้ ระบบแสดงผลจากเครื่องนี้"}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
                  <button type="button" onClick={handleStartExam} className="px-6 py-3 rounded-md bg-[#16324f] text-white font-bold text-sm">สอบชุดนี้ใหม่</button>
                  <button type="button" onClick={() => { setExamStarted(false); resetExam(); }} className="px-6 py-3 rounded-md bg-white border border-[var(--line)] font-bold text-sm">เลือกชุดอื่น</button>
                  <a href="/vocabulary" className="px-6 py-3 rounded-md bg-white border border-[var(--line)] font-bold text-sm">ไปทบทวนบัตรคำศัพท์</a>
                </div>
              </section>

              <div className="exam-layout">
                <div className="space-y-6">
                  <h3 className="font-black text-lg">ตรวจคำตอบ · <span className="text-[var(--teal)]">เขียว = เฉลย</span> · <span className="text-[var(--red)]">แดง = ตอบผิด</span></h3>
                  {sections.map((section) => (
                    <ExamSectionPaper key={section.key} levelId={activeLevel.id} part={section.part} section={section.section} questions={section.questions} answers={answers} reveal />
                  ))}
                </div>
                <aside>
                  <div className="exam-aside-title"><span>答题卡</span><span>{score}/{scoredQuestions.length}</span></div>
                  <AnswerSheet sections={sections} answers={answers} reveal />
                </aside>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer isAdmin={isAdmin} />
    </div>
  );
}
