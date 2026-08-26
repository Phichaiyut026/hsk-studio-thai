"use client";

import { useEffect, useMemo, useState } from "react";
import { dailyTasks, hskLevels, type Level } from "../lib/hsk-data";

type HskAppProps = {
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
  const key = "hsk-studio-session-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const next = crypto.randomUUID();
  window.localStorage.setItem(key, next);
  return next;
}

export default function HskApp({ authPaths, user }: HskAppProps) {
  const [levels, setLevels] = useState<Level[]>(hskLevels);
  const [activeLevel, setActiveLevel] = useState(hskLevels[0]);
  const [flipped, setFlipped] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [checkedTasks, setCheckedTasks] = useState<string[]>([]);

  const currentWord = activeLevel.vocabulary[cardIndex];
  const completion = Math.round((checkedTasks.length / dailyTasks.length) * 100);

  const studyPlan = useMemo(
    () => [
      { time: "เช้า", action: "เปิดบัตรคำและฟังเสียงในใจ", minutes: 8 },
      { time: "กลางวัน", action: "แต่งประโยคจากคำใหม่", minutes: 7 },
      { time: "เย็น", action: "ทำ quiz แล้วจดข้อผิดพลาด", minutes: 10 },
    ],
    [],
  );

  useEffect(() => {
    let ignore = false;

    async function loadStudyData() {
      try {
        const sessionId = getSessionId();
        const response = await fetch(`/api/study-data?sessionId=${encodeURIComponent(sessionId)}`);
        if (!response.ok) return;
        const data = (await response.json()) as {
          levels?: Level[];
        };
        if (ignore || !data.levels?.length) return;

        setLevels(data.levels);
        setActiveLevel((current) => data.levels?.find((level) => level.id === current.id) ?? data.levels![0]);
      } catch {
        // Keep local fallback data if the database is unavailable.
      }
    }

    loadStudyData();
    return () => {
      ignore = true;
    };
  }, []);

  function chooseLevel(level: Level) {
    setActiveLevel(level);
    setCardIndex(0);
    setFlipped(false);
  }

  function nextCard() {
    setCardIndex((index) => (index + 1) % activeLevel.vocabulary.length);
    setFlipped(false);
  }

  function toggleTask(task: string) {
    setCheckedTasks((tasks) =>
      tasks.includes(task) ? tasks.filter((item) => item !== task) : [...tasks, task],
    );
  }

  return (
    <main className="app-page min-h-screen text-[var(--ink)]">
      <section className="hero">
        <nav className="topbar" aria-label="เมนูหลัก">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">汉</span>
            <span>HSK Studio</span>
          </div>
          <div className="account-actions">
            {user ? (
              <>
                <span className="account-pill">{user.displayName}</span>
                <a className="ghost-link" href={authPaths.signOut}>ออกจากระบบ</a>
              </>
            ) : (
              <a className="ghost-link" href={authPaths.signIn}>เข้าสู่ระบบ</a>
            )}
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">เว็บเรียนจีนสำหรับผู้เรียนไทย</p>
            <h1>เรียนภาษาจีนให้จำได้ ใช้เป็น และเห็นความคืบหน้าทุกวัน</h1>
            <p className="lead">
              เลือกระดับที่กำลังสอบ ฝึกคำศัพท์พร้อมประโยคจริง ทำ quiz สั้น ๆ
              แล้วจัดแผนอ่านแบบพอดีกับวันธรรมดา
            </p>
            <div className="hero-actions">
              <a href="#levels" className="primary-action">เลือกระดับ</a>
              <a href="#quiz" className="secondary-action">ลองทำแบบทดสอบ</a>
            </div>
          </div>

          <div className="study-board" aria-label="ตัวอย่างโต๊ะเรียน">
            <div className="board-header">
              <span>今日任务</span>
              <strong>{completion}%</strong>
            </div>
            <div className="hanzi-focus">{currentWord.hanzi}</div>
            <div className="tone-row">
              <span>{currentWord.pinyin}</span>
              <span>{currentWord.thai}</span>
            </div>
            <div className="progress-ring" style={{ "--progress": `${completion}%` } as React.CSSProperties}>
              <span>{checkedTasks.length}/{dailyTasks.length}</span>
            </div>
          </div>
        </div>
      </section>

      <section id="levels" className="section">
        <div className="section-heading">
          <p className="eyebrow">เลือกเส้นทาง</p>
          <h2>ระดับที่พร้อมเรียนวันนี้</h2>
        </div>
        <div className="level-grid">
          {levels.map((level) => (
            <button
              className={`level-card ${level.id === activeLevel.id ? "is-active" : ""}`}
              key={level.id}
              onClick={() => chooseLevel(level)}
              style={{ "--accent": level.color } as React.CSSProperties}
              type="button"
            >
              <span className="level-top">
                <strong>{level.title}</strong>
                <span>{level.words} คำ</span>
              </span>
              <span>{level.target}</span>
            </button>
          ))}
        </div>
      </section>

      <section id="practice" className="workspace">
        <div className="lesson-panel">
          <p className="eyebrow">{activeLevel.title}</p>
          <h2>{activeLevel.lesson.title}</h2>
          <p>{activeLevel.focus}</p>
          <div className="lesson-note">
            <span>Grammar</span>
            <strong>{activeLevel.lesson.grammar}</strong>
          </div>
          <div className="dialog-box">{activeLevel.lesson.dialog}</div>
        </div>

        <div className="flashcard-panel">
          <div className="panel-title">
            <span>บัตรคำ</span>
            <small>{cardIndex + 1} / {activeLevel.vocabulary.length}</small>
          </div>
          <button className={`flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(!flipped)} type="button">
            <span className="card-face">
              <strong>{currentWord.hanzi}</strong>
              <em>{currentWord.pinyin}</em>
            </span>
            <span className="card-back">
              <strong>{currentWord.thai}</strong>
              <em>{currentWord.example}</em>
            </span>
          </button>
          <div className="card-controls">
            <button type="button" onClick={() => setFlipped(!flipped)}>พลิก</button>
            <button type="button" onClick={nextCard}>คำถัดไป</button>
          </div>
        </div>
      </section>

      <section id="quiz" className="practice-strip">
        <div className="quiz-panel">
          <div className="panel-title">
            <p className="eyebrow">แบบทดสอบ</p>
            <small>{user ? "พร้อมบันทึกผล" : "เข้าสู่ระบบเพื่อบันทึก"}</small>
          </div>
          <h2>ทำข้อสอบจากชุดที่สร้างในระบบ Admin</h2>
          <p className="save-status">ข้อสอบถูกดึงจากฐานข้อมูลโดยตรง ไม่ใช้ข้อมูล mock ในไฟล์ระดับแล้ว</p>
          <a className="primary-action" href={`/quiz?level=${activeLevel.id}`}>ไปหน้าแบบทดสอบ</a>
        </div>

        <div className="daily-panel">
          <div className="panel-title">
            <span>แผนวันนี้</span>
            <small>{completion}%</small>
          </div>
          <div className="task-list">
            {dailyTasks.map((task) => (
              <label key={task} className="task-item">
                <input
                  checked={checkedTasks.includes(task)}
                  onChange={() => toggleTask(task)}
                  type="checkbox"
                />
                <span>{task}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="section plan-section">
        <div className="section-heading">
          <p className="eyebrow">อ่านแบบไม่ฝืน</p>
          <h2>25 นาทีต่อวันก็เดินหน้าได้</h2>
        </div>
        <div className="plan-grid">
          {studyPlan.map((slot) => (
            <article key={slot.time} className="plan-card">
              <span>{slot.time}</span>
              <strong>{slot.action}</strong>
              <small>{slot.minutes} นาที</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
