"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SpeakButton from "./components/SpeakButton";
import { hskLevels, dailyTasks, type Level } from "../lib/hsk-data";

type Props = {
  authPaths: { signIn: string; signOut: string };
  user: { displayName: string; email: string } | null;
  isAdmin: boolean;
};

export default function HomeClient({ authPaths, user, isAdmin }: Props) {
  const [levels, setLevels] = useState<Level[]>(hskLevels);
  const [wordIndex, setWordIndex] = useState(0);
  const [checkedTasks, setCheckedTasks] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem("hsk-daily-checked-tasks");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    fetch("/api/study-data?sessionId=homepage")
      .then((response) => response.ok ? response.json() : null)
      .then((data: { levels?: Level[] } | null) => {
        if (data?.levels?.length) setLevels(data.levels);
      })
      .catch(() => undefined);
  }, []);

  const words = useMemo(() => levels.flatMap((level) => level.vocabulary), [levels]);
  const word = words[wordIndex % Math.max(words.length, 1)] || hskLevels[0].vocabulary[0];
  const completion = Math.round((checkedTasks.length / dailyTasks.length) * 100);
  const toggleTask = (taskId: string) => {
    const next = checkedTasks.includes(taskId) ? checkedTasks.filter((id) => id !== taskId) : [...checkedTasks, taskId];
    setCheckedTasks(next);
    window.localStorage.setItem("hsk-daily-checked-tasks", JSON.stringify(next));
  };

  return (
    <div className="home-shell">
      <Navbar authPaths={authPaths} user={user} isAdmin={isAdmin} />
      <main>
        <section className="hero home-hero">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">HSK STUDIO THAI / ห้องเรียนของคุณ</p>
              <h1>{user ? `พร้อมเรียนต่อไหม ${user.displayName.split(" ")[0]}` : "เรียนจีนให้จำได้ ใช้เป็น และเห็นผลทุกวัน"}</h1>
              <p className="lead">พื้นที่ฝึกภาษาจีนที่จัดทุกอย่างให้เป็นขั้นตอน ตั้งแต่คำศัพท์ เสียงอ่าน ไปจนถึงแบบทดสอบ เพื่อให้ทุกนาทีที่เรียนมีความหมาย</p>
              <div className="hero-actions">
                <a href="/vocabulary" className="primary-action">เริ่มฝึกวันนี้</a>
                <a href="#daily-plan" className="secondary-action">ดูภารกิจวันนี้</a>
              </div>
              <div className="hero-proof" aria-label="สรุปการเรียน">
                <span><strong>{words.length || 0}</strong> คำศัพท์พร้อมฝึก</span>
                <span><strong>25</strong> นาทีต่อรอบ</span>
                <span><strong>HSK 1–4</strong> ครบเส้นทาง</span>
              </div>
            </div>

            <div className="study-board word-card">
              <div className="board-header"><span>คำศัพท์ประจำวันนี้</span><span className="status-badge">ฝึกต่อเนื่อง</span></div>
              <div className="word-card-date">คำที่ {wordIndex + 1} / สุ่มใหม่ได้ทุกครั้ง</div>
              <div className="hanzi-focus" aria-live="polite">{word.hanzi}</div>
              <div className="tone-row"><div><strong className="word-pinyin">{word.pinyin}</strong><span className="word-meaning">{word.thai}</span></div><SpeakButton text={word.hanzi} label="ฟังเสียง" /></div>
              <div className="example-box"><div className="example-label">ตัวอย่างประโยค <SpeakButton text={word.example} label="ฟังประโยค" className="compact-speak" /></div><p>{word.example}</p>{word.exampleThai && <small>{word.exampleThai}</small>}</div>
              <button type="button" className="shuffle-button" onClick={() => setWordIndex((index) => index + 1)}>สุ่มคำศัพท์ใหม่ <span aria-hidden="true">→</span></button>
            </div>
          </div>
        </section>

        <section className="dashboard-section" id="daily-plan">
          <div className="section-heading"><div><p className="eyebrow">TODAY&apos;S FOCUS</p><h2>แผนของคุณวันนี้</h2></div><a href="/plan" className="text-link">เปิดแผนการเรียน →</a></div>
          <div className="dashboard-grid">
            <div className="progress-panel">
              <div className="progress-heading"><div><span className="panel-kicker">ความคืบหน้ารายวัน</span><strong>{completion}%</strong></div><span className="streak-chip">{checkedTasks.length} / {dailyTasks.length} ภารกิจ</span></div>
              <div className="progress-track" aria-label={`ทำภารกิจสำเร็จ ${completion}%`}><span style={{ width: `${completion}%` }} /></div>
              <p>{completion === 100 ? "ยอดเยี่ยม วันนี้คุณทำครบแล้ว" : "ทำทีละนิด แต่ทำให้ต่อเนื่อง แล้วผลลัพธ์จะตามมา"}</p>
              <div className="task-list">{dailyTasks.map((task, index) => <label key={task} className={`task-row ${checkedTasks.includes(task) ? "is-done" : ""}`}><input type="checkbox" checked={checkedTasks.includes(task)} onChange={() => toggleTask(task)} /><span>{task}</span><small>{[10, 12, 8, 15, 10][index]} นาที</small></label>)}</div>
            </div>
            <div className="shortcut-panel"><p className="panel-kicker">ไปต่ออย่างไรดี</p><h3>เลือกจังหวะที่เหมาะกับคุณ</h3><div className="shortcut-list"><a href="/vocabulary"><span className="shortcut-mark">字</span><span><strong>ฝึกคำศัพท์</strong><small>เปิดบัตรคำและเสียงอ่าน</small></span><b>→</b></a>{isAdmin && <a href="/quiz"><span className="shortcut-mark">测</span><span><strong>ทดสอบความจำ</strong><small>เช็กความเข้าใจทันที</small></span><b>→</b></a>}<a href="/stats"><span className="shortcut-mark">↗</span><span><strong>ดูสถิติการเรียน</strong><small>เห็นพัฒนาการของตัวเอง</small></span><b>→</b></a></div></div>
          </div>
        </section>

        <section className="dashboard-section levels-section"><div className="section-heading"><div><p className="eyebrow">YOUR LEARNING PATH</p><h2>เลือกเส้นทางที่ใช่</h2></div><span className="section-note">เริ่มจากจุดไหนก็ได้</span></div><div className="level-grid">{levels.map((level) => <article className="level-card" key={level.id} style={{ borderTopColor: level.color }}><div className="level-card-top"><span>{level.title}</span><small>{level.words} คำ</small></div><p>{level.target}</p><small className="level-focus">{level.focus}</small><div className="level-actions"><a href={`/vocabulary?level=${level.id}`}>บัตรคำ</a>{isAdmin && <a href={`/quiz?level=${level.id}`}>แบบทดสอบ</a>}</div></article>)}</div></section>
      </main>
      <Footer isAdmin={isAdmin} />
    </div>
  );
}
