"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

type AdminUser = {
  userId: string;
  email: string;
  displayName: string;
  role: "user" | "admin";
  createdAt: string;
};

type AdminVocabulary = {
  id: string;
  levelId: string;
  hanzi: string;
  pinyin: string;
  thai: string;
  example: string;
  createdAt: string;
};

type SystemOverview = {
  users: { total: number; admins: number; regular: number };
  content: { vocabulary: number; quizQuestions: number; quizAttempts: number };
  database: { binding: string; status: "ready" };
};

type AdminTab = "overview" | "users" | "vocabulary" | "vocabulary-list" | "exams";

export default function AdminClient({
  authPaths,
  user,
}: {
  authPaths: { signIn: string; signOut: string };
  user: { displayName: string; email: string };
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [vocabulary, setVocabulary] = useState<AdminVocabulary[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [vocabularyQuery, setVocabularyQuery] = useState("");
  const [vocabularyLevel, setVocabularyLevel] = useState("all");

  async function loadUsers() {
    const response = await fetch("/api/admin/users");
    if (!response.ok) return;
    const data = (await response.json()) as { users: AdminUser[] };
    setUsers(data.users);
  }

  async function loadOverview() {
    const response = await fetch("/api/admin/system");
    if (!response.ok) return;
    const data = (await response.json()) as { overview: SystemOverview };
    setOverview(data.overview);
  }

  async function loadVocabulary() {
    const response = await fetch("/api/admin/vocabulary");
    if (!response.ok) return;
    const data = (await response.json()) as { vocabulary: AdminVocabulary[] };
    setVocabulary(data.vocabulary);
  }

  useEffect(() => {
    void Promise.all([loadOverview(), loadUsers(), loadVocabulary()]);
  }, []);

  async function changeRole(userId: string, role: "user" | "admin") {
    setMessage("กำลังบันทึกสิทธิ์...");
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    setMessage(response.ok ? "บันทึกสิทธิ์เรียบร้อย" : "บันทึกสิทธิ์ไม่สำเร็จ");
    if (response.ok) await Promise.all([loadUsers(), loadOverview()]);
  }

  async function seedHskData() {
    setBusy(true);
    setMessage("กำลังเตรียมข้อมูล HSK...");
    const response = await fetch("/api/admin/system", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "seed-hsk-data" }),
    });
    if (response.ok) {
      const data = (await response.json()) as { overview: SystemOverview };
      setOverview(data.overview);
      setMessage("เตรียมข้อมูล HSK เรียบร้อย");
    } else {
      setMessage("เตรียมข้อมูลไม่สำเร็จ");
    }
    setBusy(false);
  }

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((item) =>
      [item.displayName, item.email, item.userId].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [query, users]);

  const filteredVocabulary = useMemo(() => {
    const normalized = vocabularyQuery.trim().toLowerCase();
    return vocabulary.filter((word) => {
      const matchesLevel = vocabularyLevel === "all" || word.levelId === vocabularyLevel;
      const matchesQuery = !normalized || [word.hanzi, word.pinyin, word.thai, word.example].some((value) => value.toLowerCase().includes(normalized));
      return matchesLevel && matchesQuery;
    });
  }, [vocabulary, vocabularyLevel, vocabularyQuery]);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a href="/" className="admin-sidebar-brand"><span className="admin-logo">汉</span><span><strong>HSK Studio</strong><small>Admin Console</small></span></a>
        <div className="admin-sidebar-section">
          <span className="admin-sidebar-label">ระบบจัดการ</span>
          <button type="button" className={`admin-sidebar-link ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}><span className="admin-sidebar-icon">O</span>ภาพรวม Dashboard</button>
          <button type="button" className={`admin-sidebar-link ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}><span className="admin-sidebar-icon">U</span>ผู้ใช้และสิทธิ์</button>
          <button type="button" className={`admin-sidebar-link ${activeTab === "vocabulary" ? "active" : ""}`} onClick={() => setActiveTab("vocabulary")}><span className="admin-sidebar-icon">V</span>เพิ่มคำศัพท์</button>
          <button type="button" className={`admin-sidebar-link ${activeTab === "vocabulary-list" ? "active" : ""}`} onClick={() => setActiveTab("vocabulary-list")}><span className="admin-sidebar-icon">L</span>รายการคำศัพท์</button>
          <button type="button" className={`admin-sidebar-link ${activeTab === "exams" ? "active" : ""}`} onClick={() => setActiveTab("exams")}><span className="admin-sidebar-icon">E</span>ระบบสอบ HSK</button>
        </div>
        <div className="admin-sidebar-section">
          <span className="admin-sidebar-label">ทางลัด</span>
          <a className="admin-sidebar-link" href="/" target="_blank" rel="noreferrer"><span className="admin-sidebar-icon">W</span>เปิดหน้าเว็บไซต์</a>
          <a className="admin-sidebar-link" href="/vocabulary" target="_blank" rel="noreferrer"><span className="admin-sidebar-icon">V</span>คลังคำศัพท์</a>
        </div>
        <div className="admin-sidebar-footer">
          <div className="admin-profile"><span className="admin-avatar">{user.displayName.slice(0, 1).toUpperCase()}</span><span><strong>{user.displayName}</strong><small>{user.email}</small></span></div>
          <a href={authPaths.signOut} className="admin-logout">ออกจากระบบ</a>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div><span className="admin-breadcrumb">Admin Console / {tabLabel(activeTab)}</span><h1>{tabTitle(activeTab)}</h1></div>
          <div className="admin-topbar-actions"><span className="admin-live-status"><i /> ระบบทำงานปกติ</span><a href="/" target="_blank" rel="noreferrer" className="admin-open-site">ดูเว็บไซต์</a></div>
        </header>
        {activeTab === "overview" ? <OverviewPanel overview={overview} busy={busy} seedHskData={seedHskData} setActiveTab={setActiveTab} /> : activeTab === "users" ? <UsersPanel users={filteredUsers} query={query} setQuery={setQuery} currentUserEmail={user.email} changeRole={changeRole} onCreated={() => Promise.all([loadUsers(), loadOverview()])} setMessage={setMessage} /> : activeTab === "vocabulary" ? <VocabularyPanel setMessage={setMessage} onSaved={loadVocabulary} /> : activeTab === "vocabulary-list" ? <VocabularyListPanel vocabulary={filteredVocabulary} query={vocabularyQuery} setQuery={setVocabularyQuery} level={vocabularyLevel} setLevel={setVocabularyLevel} setMessage={setMessage} onChanged={loadVocabulary} /> : <ExamsPanel />}
        {message && <p className="admin-toast" role="status">{message}</p>}
      </main>
    </div>
  );
}

function tabLabel(tab: AdminTab) {
  return { overview: "Dashboard", users: "Users", vocabulary: "Add Vocabulary", "vocabulary-list": "Vocabulary List", exams: "HSK Exams" }[tab];
}

function tabTitle(tab: AdminTab) {
  return { overview: "ภาพรวมระบบ", users: "ผู้ใช้และสิทธิ์", vocabulary: "เพิ่มคำศัพท์", "vocabulary-list": "รายการคำศัพท์ทั้งหมด", exams: "ระบบสอบ HSK" }[tab];
}

function VocabularyPanel({ setMessage, onSaved }: { setMessage: (message: string) => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ levelId: "hsk1", hanzi: "", pinyin: "", thai: "", example: "" });
  const [saving, setSaving] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("กำลังบันทึกคำศัพท์...");
    const response = await fetch("/api/admin/vocabulary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (response.ok) {
      setForm({ levelId: form.levelId, hanzi: "", pinyin: "", thai: "", example: "" });
      await onSaved();
      setMessage("เพิ่มคำศัพท์เรียบร้อย");
    } else {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(data.error ?? "เพิ่มคำศัพท์ไม่สำเร็จ");
    }
    setSaving(false);
  }

  return (
    <div className="admin-content">
      <section className="admin-page-intro"><div><span className="admin-eyebrow">คลังเนื้อหา</span><h2>เพิ่มคำศัพท์ HSK</h2><p>เพิ่มคำศัพท์ใหม่ลงฐานข้อมูลโดยเลือกตามระดับที่ต้องการ</p></div><span className="admin-content-count">ข้อมูลจะเรียงต่อท้ายระดับที่เลือกอัตโนมัติ</span></section>
      <form className="admin-card admin-vocabulary-form" onSubmit={submit}>
        <div className="admin-form-heading"><div><span className="admin-card-kicker">Vocabulary Entry</span><h3>ข้อมูลคำศัพท์</h3></div><span className="admin-required-note">ช่องที่มี * จำเป็นต้องกรอก</span></div>
        <div className="admin-form-grid">
          <label>ระดับ HSK *<select value={form.levelId} onChange={(event) => updateField("levelId", event.target.value)}>{[1, 2, 3, 4, 5, 6].map((level) => <option key={level} value={`hsk${level}`}>HSK {level}</option>)}</select></label>
          <label>คำจีน / 汉字 *<input required value={form.hanzi} onChange={(event) => updateField("hanzi", event.target.value)} placeholder="เช่น 你好" /></label>
          <label>พินอิน *<input required value={form.pinyin} onChange={(event) => updateField("pinyin", event.target.value)} placeholder="เช่น nǐ hǎo" /></label>
          <label>คำแปลภาษาไทย *<input required value={form.thai} onChange={(event) => updateField("thai", event.target.value)} placeholder="เช่น สวัสดี" /></label>
          <label className="admin-form-wide">ตัวอย่างประโยค *<textarea required value={form.example} onChange={(event) => updateField("example", event.target.value)} placeholder="เช่น 你好，我叫明。" rows={3} /></label>
        </div>
        <div className="admin-form-actions"><span>หลังบันทึก คำศัพท์จะพร้อมให้ระบบเรียนรู้ผ่าน D1</span><button className="admin-primary-button" type="submit" disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึกคำศัพท์"}</button></div>
      </form>
    </div>
  );
}

function VocabularyListPanel({ vocabulary, query, setQuery, level, setLevel, setMessage, onChanged }: { vocabulary: AdminVocabulary[]; query: string; setQuery: (value: string) => void; level: string; setLevel: (value: string) => void; setMessage: (message: string) => void; onChanged: () => Promise<void> }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminVocabulary | null>(null);
  const [saving, setSaving] = useState(false);

  function startEditing(word: AdminVocabulary) { setEditingId(word.id); setDraft({ ...word }); }
  function cancelEditing() { setEditingId(null); setDraft(null); }
  function updateDraft(field: keyof AdminVocabulary, value: string) { setDraft((current) => current ? { ...current, [field]: value } : current); }

  async function saveDraft() {
    if (!draft) return;
    setSaving(true);
    const response = await fetch("/api/admin/vocabulary", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    setMessage(response.ok ? "แก้ไขคำศัพท์เรียบร้อย" : "แก้ไขคำศัพท์ไม่สำเร็จ");
    if (response.ok) { cancelEditing(); await onChanged(); }
    setSaving(false);
  }

  async function removeWord(id: string) {
    if (!window.confirm("ต้องการลบคำศัพท์รายการนี้ใช่หรือไม่?")) return;
    const response = await fetch(`/api/admin/vocabulary?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setMessage(response.ok ? "ลบคำศัพท์เรียบร้อย" : "ลบคำศัพท์ไม่สำเร็จ");
    if (response.ok) await onChanged();
  }

  return (
    <div className="admin-content">
      <section className="admin-page-intro"><div><span className="admin-eyebrow">คลังเนื้อหา</span><h2>คำศัพท์ทั้งหมด</h2><p>แก้ไขหรือลบคำศัพท์จากฐานข้อมูลได้โดยตรง</p></div><span className="admin-content-count">พบ {vocabulary.length.toLocaleString("th-TH")} รายการ</span></section>
      <section className="admin-card admin-vocabulary-list-card">
        <div className="admin-list-toolbar"><label className="admin-search"><span>ค้นหาคำศัพท์</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาคำจีน พินอิน หรือคำแปล" /></label><label className="admin-level-filter"><span>ระดับ</span><select value={level} onChange={(event) => setLevel(event.target.value)}><option value="all">ทุกระดับ</option>{[1, 2, 3, 4, 5, 6].map((item) => <option key={item} value={`hsk${item}`}>HSK {item}</option>)}</select></label></div>
        <div className="admin-table-scroll"><table className="admin-vocabulary-table"><thead><tr><th>ระดับ</th><th>คำจีน</th><th>พินอิน</th><th>คำแปล</th><th>ตัวอย่างประโยค</th><th>จัดการ</th></tr></thead><tbody>{vocabulary.map((word) => { const isEditing = editingId === word.id && draft; return <tr key={word.id}>{isEditing ? <><td><select value={draft.levelId} onChange={(event) => updateDraft("levelId", event.target.value)}>{[1, 2, 3, 4, 5, 6].map((item) => <option key={item} value={`hsk${item}`}>HSK {item}</option>)}</select></td><td><input value={draft.hanzi} onChange={(event) => updateDraft("hanzi", event.target.value)} /></td><td><input value={draft.pinyin} onChange={(event) => updateDraft("pinyin", event.target.value)} /></td><td><input value={draft.thai} onChange={(event) => updateDraft("thai", event.target.value)} /></td><td><textarea value={draft.example} onChange={(event) => updateDraft("example", event.target.value)} rows={2} /></td><td><div className="admin-row-actions"><button type="button" onClick={() => void saveDraft()} disabled={saving}>บันทึก</button><button type="button" onClick={cancelEditing}>ยกเลิก</button></div></td></> : <><td><span className="admin-level-badge">{word.levelId.toUpperCase()}</span></td><td><strong className="admin-table-hanzi">{word.hanzi}</strong></td><td>{word.pinyin}</td><td>{word.thai}</td><td className="admin-example-cell">{word.example}</td><td><div className="admin-row-actions"><button type="button" onClick={() => startEditing(word)}>แก้ไข</button><button type="button" className="danger" onClick={() => void removeWord(word.id)}>ลบ</button></div></td></>}</tr>; })}</tbody></table>{!vocabulary.length && <p className="admin-empty">ยังไม่มีคำศัพท์ที่ตรงกับเงื่อนไข</p>}</div>
      </section>
    </div>
  );
}

function ExamsPanel() {
  const examLevels = [
    { level: "HSK 1", description: "พื้นฐานการสื่อสารในชีวิตประจำวัน", parts: [{ name: "ฟัง", count: 0, minutes: 15 }, { name: "อ่าน", count: 0, minutes: 17 }] },
    { level: "HSK 2", description: "ประโยคและบทสนทนาที่ใช้บ่อย", parts: [{ name: "ฟัง", count: 0, minutes: 25 }, { name: "อ่าน", count: 0, minutes: 22 }] },
    { level: "HSK 3", description: "สื่อสารเรื่องทั่วไปและข้อความสั้น", parts: [{ name: "ฟัง", count: 0, minutes: 35 }, { name: "อ่าน", count: 0, minutes: 30 }, { name: "เขียน", count: 0, minutes: 15 }] },
    { level: "HSK 4", description: "เข้าใจเนื้อหาที่ซับซ้อนขึ้น", parts: [{ name: "ฟัง", count: 0, minutes: 30 }, { name: "อ่าน", count: 0, minutes: 40 }, { name: "เขียน", count: 0, minutes: 15 }] },
    { level: "HSK 5", description: "อ่านข่าวและสื่อสารเชิงลึก", parts: [{ name: "ฟัง", count: 0, minutes: 30 }, { name: "อ่าน", count: 0, minutes: 45 }, { name: "เขียน", count: 0, minutes: 40 }] },
    { level: "HSK 6", description: "ใช้งานภาษาจีนระดับสูง", parts: [{ name: "ฟัง", count: 0, minutes: 35 }, { name: "อ่าน", count: 0, minutes: 50 }, { name: "เขียน", count: 0, minutes: 45 }] },
  ];

  return (
    <div className="admin-content">
      <section className="admin-page-intro"><div><span className="admin-eyebrow">Exam Builder</span><h2>โครงสร้างระบบสอบ HSK</h2><p>วางโครงสร้างไว้ก่อน แล้วค่อยเติมข้อสอบจริงจากไฟล์ที่เตรียมไว้ภายหลัง</p></div><span className="admin-draft-badge">ร่างโครงสร้าง</span></section>
      <section className="admin-exam-notice"><strong>พื้นที่เตรียมข้อสอบ</strong><span>ตอนนี้ยังไม่มีข้อสอบจริงในแต่ละพาร์ท เมนูนี้เตรียมไว้สำหรับนำเข้าข้อมูลภายหลัง</span></section>
      <section className="admin-exam-grid">{examLevels.map((exam) => <article className="admin-card admin-exam-card" key={exam.level}><div className="admin-exam-heading"><div><span className="admin-card-kicker">Mock Exam</span><h3>{exam.level}</h3></div><span className="admin-draft-badge">Draft</span></div><p>{exam.description}</p><div className="admin-exam-parts">{exam.parts.map((part) => <div className="admin-exam-part" key={part.name}><span><strong>{part.name}</strong><small>{part.minutes} นาที</small></span><b>{part.count}<small>ข้อ</small></b></div>)}</div><button type="button" className="admin-outline-button" disabled>เพิ่มข้อสอบเร็วๆ นี้</button></article>)}</section>
    </div>
  );
}

function OverviewPanel({ overview, busy, seedHskData, setActiveTab }: { overview: SystemOverview | null; busy: boolean; seedHskData: () => Promise<void>; setActiveTab: (tab: AdminTab) => void }) {
  return (
    <div className="admin-content">
      <section className="admin-welcome"><div><span className="admin-eyebrow">ศูนย์ควบคุม HSK Studio</span><h2>สวัสดีครับ, พร้อมจัดการระบบแล้ว</h2><p>ดูภาพรวมผู้เรียน ตรวจข้อมูลการเรียน และจัดการสิทธิ์ได้จากหน้านี้</p></div><div className="admin-welcome-mark">漢</div></section>
      <section className="admin-metrics-grid" aria-label="สรุประบบ">
        <Metric label="ผู้ใช้ทั้งหมด" value={overview?.users.total ?? 0} hint="บัญชีในระบบ" tone="red" />
        <Metric label="ผู้ดูแลระบบ" value={overview?.users.admins ?? 0} hint="บัญชีที่มีสิทธิ์ Admin" tone="blue" />
        <Metric label="คำศัพท์ในคลัง" value={overview?.content.vocabulary ?? 0} hint="รายการพร้อมเรียน" tone="teal" />
        <Metric label="การทำแบบทดสอบ" value={overview?.content.quizAttempts ?? 0} hint="ความพยายามทั้งหมด" tone="gold" />
      </section>
      <div className="admin-dashboard-grid">
        <section className="admin-card admin-database-card"><div className="admin-card-heading"><div><span className="admin-card-kicker">สถานะระบบ</span><h3>ฐานข้อมูล D1</h3></div><span className="admin-status-badge"><i /> พร้อมใช้งาน</span></div><p>ฐานข้อมูลเชื่อมต่อแล้วและพร้อมเก็บข้อมูลผู้ใช้ คำศัพท์ คำถาม และผลแบบทดสอบ</p><div className="admin-binding-row"><span>Binding</span><strong>{overview?.database.binding ?? "DB"}</strong></div><button className="admin-primary-button" type="button" onClick={seedHskData} disabled={busy}>{busy ? "กำลังเตรียมข้อมูล..." : "เตรียมข้อมูล HSK"}</button></section>
        <section className="admin-card admin-actions-card"><div className="admin-card-heading"><div><span className="admin-card-kicker">การจัดการ</span><h3>ทางลัดสำหรับแอดมิน</h3></div></div><button type="button" className="admin-action-row" onClick={() => setActiveTab("users")}><span className="admin-action-icon">U</span><span><strong>จัดการผู้ใช้</strong><small>เปลี่ยนสิทธิ์ User และ Admin</small></span><b>→</b></button><a className="admin-action-row" href="/" target="_blank" rel="noreferrer"><span className="admin-action-icon">W</span><span><strong>เปิดหน้าเว็บไซต์</strong><small>ตรวจประสบการณ์ของผู้เรียน</small></span><b>↗</b></a></section>
      </div>
      <section className="admin-card admin-summary-card"><div className="admin-card-heading"><div><span className="admin-card-kicker">สรุปข้อมูล</span><h3>โครงสร้างผู้ใช้และเนื้อหา</h3></div><button type="button" className="admin-text-button" onClick={() => setActiveTab("users")}>ดูผู้ใช้ทั้งหมด →</button></div><div className="admin-summary-list"><SummaryRow label="ผู้ใช้ทั่วไป" value={overview?.users.regular ?? 0} total={overview?.users.total ?? 0} color="var(--blue)" /><SummaryRow label="คำถามแบบทดสอบ" value={overview?.content.quizQuestions ?? 0} total={overview?.content.quizQuestions ?? 0} color="var(--teal)" /><SummaryRow label="ผู้ดูแลระบบ" value={overview?.users.admins ?? 0} total={overview?.users.total ?? 0} color="var(--red)" /></div></section>
    </div>
  );
}

function UsersPanel({ users, query, setQuery, currentUserEmail, changeRole, onCreated, setMessage }: { users: AdminUser[]; query: string; setQuery: (value: string) => void; currentUserEmail: string; changeRole: (userId: string, role: "user" | "admin") => Promise<void>; onCreated: () => Promise<void>; setMessage: (message: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ displayName: "", email: "", password: "", role: "user" as "user" | "admin" });
  const [saving, setSaving] = useState(false);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setMessage(response.ok ? "สร้างบัญชีเรียบร้อย" : data.error ?? "สร้างบัญชีไม่สำเร็จ");
    if (response.ok) { setForm({ displayName: "", email: "", password: "", role: "user" }); setShowForm(false); await onCreated(); }
    setSaving(false);
  }

  return <div className="admin-content"><section className="admin-page-intro"><div><span className="admin-eyebrow">สิทธิ์การเข้าถึง</span><h2>จัดการผู้ใช้</h2><p>กำหนดว่าใครสามารถเข้าถึงเครื่องมือจัดการระบบได้</p></div><div className="admin-user-toolbar"><label className="admin-search"><span>ค้นหา</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ชื่อ อีเมล หรือ User ID" /></label><button type="button" className="admin-primary-button" onClick={() => setShowForm((current) => !current)}>{showForm ? "ปิดฟอร์ม" : "เพิ่มผู้ใช้"}</button></div></section>{showForm && <form className="admin-card admin-user-form" onSubmit={createUser}><label>ชื่อผู้ใช้<input required value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} /></label><label>อีเมล<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>รหัสผ่าน<input required minLength={6} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label><label>สิทธิ์<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as "user" | "admin" })}><option value="user">User</option><option value="admin">Admin</option></select></label><button className="admin-primary-button" type="submit" disabled={saving}>{saving ? "กำลังสร้าง..." : "สร้างบัญชี"}</button></form>}<section className="admin-card admin-table-card"><div className="admin-table-meta"><strong>{users.length} บัญชี</strong><span>Admin ตรวจสิทธิ์ที่ฝั่งเซิร์ฟเวอร์ทุกครั้ง</span></div><div className="admin-table-scroll"><table className="admin-users-table"><thead><tr><th>ผู้ใช้</th><th>อีเมล</th><th>สิทธิ์</th><th>สร้างเมื่อ</th></tr></thead><tbody>{users.map((item) => <tr key={item.userId}><td><strong>{item.displayName}</strong><small>{item.userId}</small></td><td>{item.email}</td><td><select value={item.role} onChange={(event) => void changeRole(item.userId, event.target.value as "user" | "admin")} disabled={item.email === currentUserEmail}><option value="user">User</option><option value="admin">Admin</option></select></td><td>{new Date(item.createdAt).toLocaleDateString("th-TH")}</td></tr>)}</tbody></table>{!users.length && <p className="admin-empty">ไม่พบผู้ใช้ที่ค้นหา</p>}</div></section></div>;
}

function Metric({ label, value, hint, tone }: { label: string; value: number; hint: string; tone: string }) {
  return <article className={`admin-metric-card ${tone}`}><span>{label}</span><strong>{value.toLocaleString("th-TH")}</strong><small>{hint}</small></article>;
}

function SummaryRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const width = total ? Math.min(Math.max((value / total) * 100, 4), 100) : 4;
  return <div className="admin-summary-row"><div><span>{label}</span><strong>{value.toLocaleString("th-TH")}</strong></div><div className="admin-progress"><i style={{ width: `${width}%`, background: color }} /></div></div>;
}
