"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SpeakButton from "./components/SpeakButton";
import CrystalScene from "./components/CrystalScene";
import { hskLevels, dailyTasks, type Level } from "../lib/hsk-data";

type Props = { authPaths: { signIn: string; signOut: string }; user: { displayName: string; email: string } | null; isAdmin: boolean };

const modules = [
  { href: "/vocabulary", tag: "01 / ฝึกจำ", title: "บัตรคำที่จำได้จริง", text: "เปิดดูคำศัพท์พร้อมเสียงอ่าน พินอิน และตัวอย่างประโยคในจังหวะที่เหมาะกับคุณ.", tone: "aqua" },
  { href: "/lessons", tag: "02 / เข้าใจ", title: "ไวยากรณ์แบบไม่งง", text: "เปลี่ยนโครงสร้างภาษาจีนให้เป็นบทสนทนาที่ใช้ได้ในชีวิตประจำวัน.", tone: "violet", admin: true },
  { href: "/quiz", tag: "03 / วัดผล", title: "รู้ว่าพร้อมแค่ไหน", text: "แบบทดสอบสั้น ๆ พร้อมเฉลย เพื่อเห็นพัฒนาการของตัวเองชัดขึ้น.", tone: "orange", admin: true },
  { href: "/plan", tag: "04 / สม่ำเสมอ", title: "25 นาทีที่เปลี่ยนทุกวัน", text: "วางแผน ฝึกสมาธิ และสร้างนิสัยเรียนจีนให้เดินหน้าอย่างเป็นธรรมชาติ.", tone: "blue", admin: true },
  { href: "/stats", tag: "05 / เห็นภาพ", title: "ติดตามทุกก้าวเล็ก ๆ", text: "ดูคำที่จำได้ ระดับที่กำลังเรียน และเป้าหมายถัดไปของคุณ.", tone: "pink" },
];

export default function HomeClient({ authPaths, user, isAdmin }: Props) {
  const [levels, setLevels] = useState<Level[]>(hskLevels);
  const [checkedTasks] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem("hsk-daily-checked-tasks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => { let ignore = false; fetch("/api/study-data?sessionId=homepage").then((r) => r.ok ? r.json() : null).then((data: { levels?: Level[] } | null) => { if (!ignore && data?.levels?.length) setLevels(data.levels); }).catch(() => undefined); return () => { ignore = true; }; }, []);
  useEffect(() => { const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }), { threshold: 0.12 }); document.querySelectorAll(".scroll-reveal").forEach((el) => observer.observe(el)); return () => observer.disconnect(); }, []);
  const word = useMemo(() => {
    const all = levels.flatMap((level) => level.vocabulary);
    const fallback = hskLevels.flatMap((level) => level.vocabulary);
    const words = all.length ? all : fallback;
    return words[new Date().getDate() % words.length] || words[0];
  }, [levels]);
  const completion = Math.round((checkedTasks.length / dailyTasks.length) * 100);

  return <div className="app-page min-h-screen"><Navbar authPaths={authPaths} user={user} isAdmin={isAdmin} /><main>
    <section className="hero-shell">
      <div className="hero-copy scroll-reveal"><div className="eyebrow"><span className="eyebrow-dot" /> HSK STUDIO / THAI LEARNERS</div><h1>ภาษาจีนที่<br /><em>เข้ามาอยู่</em> ในชีวิตคุณ</h1><p className="hero-lead">พื้นที่ฝึกภาษาจีนที่ออกแบบให้คนไทยเรียนได้ต่อเนื่อง เข้าใจง่าย และกล้าที่จะใช้จริงในทุกวัน</p><div className="hero-actions"><a href="/vocabulary" className="button button-primary">เริ่มเรียนวันนี้ <span>↗</span></a><a href="#modules" className="text-link">ดูวิธีเรียน <span>↓</span></a></div><div className="hero-proof"><span className="proof-avatars"><b>汉</b><b>中</b><b>学</b></span><span>เรียนรู้ไปพร้อมกับ<br /><strong>ผู้เรียนไทยอีกมากมาย</strong></span></div></div>
      <div className="hero-visual scroll-reveal"><CrystalScene /><div className="visual-note note-top"><span>学</span><small>LEARN<br />WITH INTENT</small></div><div className="visual-note note-bottom"><strong>04</strong><small>HSK LEVELS<br />READY FOR YOU</small></div></div>
    </section>
    <section className="marquee-band" aria-label="คำโปรย"><div>จำได้ <span>·</span> ใช้เป็น <span>·</span> เห็นผล <span>·</span> จำได้ <span>·</span> ใช้เป็น <span>·</span> เห็นผล</div></section>
    <section id="modules" className="content-section scroll-reveal"><div className="section-heading"><div><div className="eyebrow">A BETTER WAY TO LEARN</div><h2>เลือกจังหวะ<br />ที่เหมาะกับคุณ</h2></div><p>ไม่ว่าคุณจะเพิ่งเริ่มต้น หรือกำลังเตรียมสอบ HSK — เครื่องมือทุกชิ้นถูกสร้างขึ้นเพื่อให้การเรียนจีนรู้สึกเบาลง และสนุกขึ้น</p></div><div className="module-grid">{modules.filter((module) => !module.admin || isAdmin).map((module) => <a key={module.href} href={module.href} className={`module-card ${module.tone}`}><span className="module-tag">{module.tag}</span><h3>{module.title}</h3><p>{module.text}</p><span className="card-arrow">↗</span></a>)}</div></section>
    <section className="practice-section scroll-reveal"><div className="practice-copy"><div className="eyebrow">TODAY&apos;S PRACTICE</div><h2>เริ่มจากคำเดียว<br />แล้วค่อย ๆ ไปไกลขึ้น</h2><p>คำศัพท์ประจำวันนี้ พร้อมเสียงอ่านและประโยคตัวอย่าง ให้คุณเริ่มฝึกได้ทันที</p><a href="/vocabulary" className="button button-outline">เปิดคลังคำศัพท์ <span>↗</span></a></div><div className="word-card"><div className="word-card-top"><span>คำศัพท์ประจำวัน</span><span className="live-dot">● LIVE</span></div><div className="hanzi-focus">{word.hanzi}</div><div className="word-meta"><div><strong>{word.pinyin}</strong><span>{word.thai}</span></div><SpeakButton text={word.hanzi} label="ฟังเสียง" /></div><div className="example-line"><span>例句</span><p>{word.example}</p></div><div className="progress-line"><span>ภารกิจวันนี้</span><strong>{checkedTasks.length}/{dailyTasks.length} · {completion}%</strong><div className="progress-track"><i style={{ width: `${completion}%` }} /></div></div></div></section>
    <section className="levels-section scroll-reveal"><div className="eyebrow">THE ROAD AHEAD</div><h2>พร้อมไปต่อในทุกระดับ</h2><div className="level-row">{levels.map((level) => <a href={`/vocabulary?level=${level.id}`} key={level.id} className="level-pill"><span style={{ background: level.color }} /> <strong>{level.title}</strong><small>{level.words} คำ</small></a>)}</div></section>
  </main><Footer isAdmin={isAdmin} /></div>;
}
