"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

type AdminUser = {
  userId: string;
  email: string;
  displayName: string;
  role: "user" | "admin";
  disabledAt: string | null;
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

type AdminQuestion = {
  id: string;
  levelId: string;
  documentId: string;
  part: string;
  section: string;
  format: string;
  questionNumber: number;
  prompt: string;
  choices: string[];
  answer: string;
  mediaUrl: string;
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
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [vocabularyQuery, setVocabularyQuery] = useState("");
  const [vocabularyLevel, setVocabularyLevel] = useState("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  async function loadQuestions() {
    const response = await fetch("/api/admin/exams");
    if (!response.ok) return;
    const data = (await response.json()) as { questions: AdminQuestion[] };
    setQuestions(data.questions);
  }

  useEffect(() => {
    void Promise.all([loadOverview(), loadUsers(), loadVocabulary(), loadQuestions()]);
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

  async function syncHuggingFaceData() {
    setBusy(true);
    setMessage("กำลังดึงคำศัพท์จาก Hugging Face...");
    const response = await fetch("/api/admin/system", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync-huggingface-hsk" }),
    });
    const data = (await response.json().catch(() => ({}))) as { result?: { imported?: number }; error?: string; overview?: SystemOverview };
    if (response.ok) {
      if (data.overview) setOverview(data.overview);
      setMessage(`นำเข้าคำศัพท์ HSK สำเร็จ ${data.result?.imported ?? 0} รายการ`);
    } else {
      setMessage(data.error ?? "ดึงข้อมูลจาก Hugging Face ไม่สำเร็จ");
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
      <aside className={`admin-sidebar ${sidebarCollapsed ? "is-collapsed" : ""}`}>
        <a href="/" className="admin-sidebar-brand" title="กลับหน้าเว็บไซต์"><span className="admin-logo">汉</span><span className="admin-sidebar-brand-copy"><strong>HSK Studio</strong><small>Admin Console</small></span></a>
        <button
          type="button"
          className="admin-sidebar-toggle"
          onClick={() => setSidebarCollapsed((current) => !current)}
          aria-label={sidebarCollapsed ? "ขยายเมนู" : "ย่อเมนู"}
          title={sidebarCollapsed ? "ขยายเมนู" : "ย่อเมนู"}
        >
          <span aria-hidden="true">{sidebarCollapsed ? "›" : "‹"}</span>
          <span className="admin-sidebar-toggle-text">{sidebarCollapsed ? "ขยายเมนู" : "ย่อเมนู"}</span>
        </button>
        <div className="admin-sidebar-section">
          <span className="admin-sidebar-label">ระบบจัดการ</span>
          <button type="button" title="ภาพรวม Dashboard" className={`admin-sidebar-link ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}><span className="admin-sidebar-icon">O</span><span className="admin-sidebar-link-text">ภาพรวม Dashboard</span></button>
          <button type="button" title="ผู้ใช้และสิทธิ์" className={`admin-sidebar-link ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}><span className="admin-sidebar-icon">U</span><span className="admin-sidebar-link-text">ผู้ใช้และสิทธิ์</span></button>
          <button type="button" title="เพิ่มคำศัพท์" className={`admin-sidebar-link ${activeTab === "vocabulary" ? "active" : ""}`} onClick={() => setActiveTab("vocabulary")}><span className="admin-sidebar-icon">V</span><span className="admin-sidebar-link-text">เพิ่มคำศัพท์</span></button>
          <button type="button" title="รายการคำศัพท์" className={`admin-sidebar-link ${activeTab === "vocabulary-list" ? "active" : ""}`} onClick={() => setActiveTab("vocabulary-list")}><span className="admin-sidebar-icon">L</span><span className="admin-sidebar-link-text">รายการคำศัพท์</span></button>
          <button type="button" title="ระบบสอบ HSK" className={`admin-sidebar-link ${activeTab === "exams" ? "active" : ""}`} onClick={() => setActiveTab("exams")}><span className="admin-sidebar-icon">E</span><span className="admin-sidebar-link-text">ระบบสอบ HSK</span></button>
        </div>
        <div className="admin-sidebar-section">
          <span className="admin-sidebar-label">ทางลัด</span>
          <a className="admin-sidebar-link" href="/" target="_blank" rel="noreferrer" title="เปิดหน้าเว็บไซต์"><span className="admin-sidebar-icon">W</span><span className="admin-sidebar-link-text">เปิดหน้าเว็บไซต์</span></a>
          <a className="admin-sidebar-link" href="/vocabulary" target="_blank" rel="noreferrer" title="คลังคำศัพท์"><span className="admin-sidebar-icon">V</span><span className="admin-sidebar-link-text">คลังคำศัพท์</span></a>
        </div>
        <div className="admin-sidebar-footer">
          <div className="admin-profile"><span className="admin-avatar">{user.displayName.slice(0, 1).toUpperCase()}</span><span className="admin-profile-copy"><strong>{user.displayName}</strong><small>{user.email}</small></span></div>
          <a href={authPaths.signOut} className="admin-logout" title="ออกจากระบบ"><span aria-hidden="true">↪</span><span className="admin-sidebar-link-text">ออกจากระบบ</span></a>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div><span className="admin-breadcrumb">Admin Console / {tabLabel(activeTab)}</span><h1>{tabTitle(activeTab)}</h1></div>
          <div className="admin-topbar-actions"><span className="admin-live-status"><i /> ระบบทำงานปกติ</span><a href="/" target="_blank" rel="noreferrer" className="admin-open-site">ดูเว็บไซต์</a></div>
        </header>
        {activeTab === "overview" ? <OverviewPanel overview={overview} busy={busy} seedHskData={seedHskData} syncHuggingFaceData={syncHuggingFaceData} setActiveTab={setActiveTab} /> : activeTab === "users" ? <UsersPanel users={filteredUsers} query={query} setQuery={setQuery} currentUserEmail={user.email} changeRole={changeRole} onCreated={() => Promise.all([loadUsers(), loadOverview()])} setMessage={setMessage} /> : activeTab === "vocabulary" ? <VocabularyPanel setMessage={setMessage} onSaved={loadVocabulary} /> : activeTab === "vocabulary-list" ? <VocabularyListPanel vocabulary={filteredVocabulary} query={vocabularyQuery} setQuery={setVocabularyQuery} level={vocabularyLevel} setLevel={setVocabularyLevel} setMessage={setMessage} onChanged={loadVocabulary} /> : <ExamsPanel questions={questions} setMessage={setMessage} onSaved={loadQuestions} />}
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
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(vocabulary.length / pageSize));
  const visibleVocabulary = vocabulary.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, level]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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
        <div className="admin-table-scroll"><table className="admin-vocabulary-table"><thead><tr><th>ระดับ</th><th>คำจีน</th><th>พินอิน</th><th>คำแปล</th><th>ตัวอย่างประโยค</th><th>จัดการ</th></tr></thead><tbody>{visibleVocabulary.map((word) => { const isEditing = editingId === word.id && draft; return <tr key={word.id}>{isEditing ? <><td><select value={draft.levelId} onChange={(event) => updateDraft("levelId", event.target.value)}>{[1, 2, 3, 4, 5, 6].map((item) => <option key={item} value={`hsk${item}`}>HSK {item}</option>)}</select></td><td><input value={draft.hanzi} onChange={(event) => updateDraft("hanzi", event.target.value)} /></td><td><input value={draft.pinyin} onChange={(event) => updateDraft("pinyin", event.target.value)} /></td><td><input value={draft.thai} onChange={(event) => updateDraft("thai", event.target.value)} /></td><td><textarea value={draft.example} onChange={(event) => updateDraft("example", event.target.value)} rows={2} /></td><td><div className="admin-row-actions"><button type="button" onClick={() => void saveDraft()} disabled={saving}>บันทึก</button><button type="button" onClick={cancelEditing}>ยกเลิก</button></div></td></> : <><td><span className={`admin-level-badge ${word.levelId.toLowerCase()}`}>{word.levelId.toUpperCase()}</span></td><td><strong className="admin-table-hanzi">{word.hanzi}</strong></td><td>{word.pinyin}</td><td>{word.thai}</td><td className="admin-example-cell">{word.example}</td><td><div className="admin-row-actions"><button type="button" onClick={() => startEditing(word)}>แก้ไข</button><button type="button" className="danger" onClick={() => void removeWord(word.id)}>ลบ</button></div></td></>}</tr>; })}</tbody></table>{!vocabulary.length && <p className="admin-empty">ยังไม่มีคำศัพท์ที่ตรงกับเงื่อนไข</p>}</div>
        <div className="admin-table-meta"><span>แสดง {visibleVocabulary.length} จาก {vocabulary.length.toLocaleString("th-TH")} รายการ</span><div className="admin-row-actions"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>ก่อนหน้า</button><span>หน้า {page} / {totalPages}</span><button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>ถัดไป</button></div></div>
      </section>
    </div>
  );
}

type ExamSectionBlueprint = {
  id: string;
  label: string;
  from: number;
  to: number;
  format: "choice" | "true-false" | "image-choice" | "matching" | "fill-blank";
};

type ExamPartBlueprint = {
  id: "listening" | "reading" | "writing";
  label: string;
  count: number;
  minutes: number;
  sections: ExamSectionBlueprint[];
};

const fallbackExamParts: ExamPartBlueprint[] = [
  { id: "listening", label: "听力 · การฟัง", count: 20, minutes: 15, sections: [{ id: "1", label: "ส่วนที่ 1", from: 1, to: 20, format: "choice" }] },
  { id: "reading", label: "阅读 · การอ่าน", count: 20, minutes: 17, sections: [{ id: "1", label: "ส่วนที่ 1", from: 21, to: 40, format: "choice" }] },
];

const examBlueprints: Record<string, { total: number; minutes: number; passingScore: number; parts: ExamPartBlueprint[]; note: string }> = {
  hsk1: {
    total: 40,
    minutes: 35,
    passingScore: 120,
    note: "HSK 1 มี 2 พาร์ต รวม 40 ข้อ โดยมีพินอินกำกับอักษรจีนทุกตัว",
    parts: [
      {
        id: "listening",
        label: "听力 · การฟัง",
        count: 20,
        minutes: 15,
        sections: [
          { id: "1", label: "ส่วนที่ 1 · ฟังประโยค/คำ แล้วดูภาพ ถูก/ผิด", from: 1, to: 5, format: "true-false" },
          { id: "2", label: "ส่วนที่ 2 · ฟังประโยคแล้วเลือกภาพ", from: 6, to: 10, format: "image-choice" },
          { id: "3", label: "ส่วนที่ 3 · ฟังบทสนทนาแล้วจับคู่ภาพ", from: 11, to: 15, format: "matching" },
          { id: "4", label: "ส่วนที่ 4 · ฟังบทสนทนาและคำถาม", from: 16, to: 20, format: "choice" },
        ],
      },
      {
        id: "reading",
        label: "阅读 · การอ่าน",
        count: 20,
        minutes: 17,
        sections: [
          { id: "1", label: "ส่วนที่ 1 · ดูภาพและคำศัพท์ ถูก/ผิด", from: 21, to: 25, format: "true-false" },
          { id: "2", label: "ส่วนที่ 2 · ดูภาพแล้วจับคู่ประโยค", from: 26, to: 30, format: "matching" },
          { id: "3", label: "ส่วนที่ 3 · จับคู่คำถามและคำตอบ", from: 31, to: 35, format: "matching" },
          { id: "4", label: "ส่วนที่ 4 · เติมคำในช่องว่าง", from: 36, to: 40, format: "fill-blank" },
        ],
      },
    ],
  },
};

function ExamsPanel({ questions, setMessage, onSaved }: { questions: AdminQuestion[]; setMessage: (message: string) => void; onSaved: () => Promise<void> }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [choiceImageFiles, setChoiceImageFiles] = useState<Array<File | null>>([null, null, null, null, null]);
  const [form, setForm] = useState({ levelId: "hsk1", documentId: "H11329", part: "listening", section: "1", format: "true-false", questionNumber: "1", prompt: "", choices: ["", "", "", ""], answer: "", mediaUrl: "" });
  const update = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const updateChoice = (index: number, value: string) => setForm((current) => ({ ...current, choices: current.choices.map((choice, choiceIndex) => choiceIndex === index ? value : choice) }));
  const blueprint = examBlueprints[form.levelId] ?? { total: 40, minutes: 35, passingScore: 120, note: "โครงสร้างพื้นฐานสำหรับระดับนี้ กรุณาตรวจสอบ Blueprint ก่อนเพิ่มข้อสอบ", parts: fallbackExamParts };
  const activePart = blueprint.parts.find((part) => part.id === form.part) ?? blueprint.parts[0];
  const activeSection = activePart.sections.find((section) => section.id === form.section) ?? activePart.sections[0];
  const isListeningTrueFalse = form.part === "listening" && form.section === "1" && form.format === "true-false";
  const isListeningImageChoice = form.part === "listening" && form.format === "image-choice";
  const isListeningImageMatching = form.part === "listening" && form.section === "3" && form.format === "matching";

  function updateLevel(levelId: string) {
    const nextBlueprint = examBlueprints[levelId] ?? { total: 40, minutes: 35, passingScore: 120, note: "โครงสร้างพื้นฐานสำหรับระดับนี้ กรุณาตรวจสอบ Blueprint ก่อนเพิ่มข้อสอบ", parts: fallbackExamParts };
    const nextPart = nextBlueprint.parts[0];
    const nextSection = nextPart.sections[0];
    setForm((current) => ({ ...current, levelId, part: nextPart.id, section: nextSection.id, format: nextSection.format, questionNumber: String(nextSection.from) }));
  }

  function updatePart(partId: string) {
    const nextPart = blueprint.parts.find((part) => part.id === partId) ?? blueprint.parts[0];
    const nextSection = nextPart.sections[0];
    setForm((current) => ({ ...current, part: nextPart.id, section: nextSection.id, format: nextSection.format, questionNumber: String(nextSection.from) }));
  }

  function updateSection(sectionId: string) {
    const nextSection = activePart.sections.find((section) => section.id === sectionId) ?? activePart.sections[0];
    setForm((current) => ({ ...current, section: nextSection.id, format: nextSection.format, questionNumber: String(nextSection.from) }));
  }

  function updateQuestionNumber(value: string) {
    const number = Number(value);
    const matchingSection = activePart.sections.find((section) => number >= section.from && number <= section.to);
    setForm((current) => ({ ...current, questionNumber: value, ...(matchingSection ? { section: matchingSection.id, format: matchingSection.format } : {}) }));
  }
  async function createQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    let mediaUrl = form.mediaUrl;
    let imageUrl = "";
    if (audioFile || imageFile || choiceImageFiles.some(Boolean)) {
      setUploadingMedia(true);
      for (const [file, target] of [[audioFile, "audio"], [imageFile, "image"]] as const) {
        if (!file) continue;
        const uploadData = new FormData();
        uploadData.append("file", file);
        const uploadResponse = await fetch("/api/admin/media", { method: "POST", body: uploadData });
        const uploadResult = (await uploadResponse.json().catch(() => ({}))) as { mediaUrl?: string; error?: string };
        if (!uploadResponse.ok || !uploadResult.mediaUrl) {
          setUploadingMedia(false);
          setMessage(uploadResult.error ?? "อัปโหลดไฟล์ไม่สำเร็จ");
          setSaving(false);
          return;
        }
        if (target === "audio") mediaUrl = uploadResult.mediaUrl;
        else imageUrl = uploadResult.mediaUrl;
      }
      if (activeSection.format === "image-choice" || isListeningImageMatching) {
        const choiceImageUrls: string[] = [];
        for (const file of choiceImageFiles) {
          if (!file) { choiceImageUrls.push(""); continue; }
          const uploadData = new FormData();
          uploadData.append("file", file);
          const uploadResponse = await fetch("/api/admin/media", { method: "POST", body: uploadData });
          const uploadResult = (await uploadResponse.json().catch(() => ({}))) as { mediaUrl?: string; error?: string };
          if (!uploadResponse.ok || !uploadResult.mediaUrl) {
            setUploadingMedia(false);
            setMessage(uploadResult.error ?? "อัปโหลดรูปตัวเลือกไม่สำเร็จ");
            setSaving(false);
            return;
          }
          choiceImageUrls.push(uploadResult.mediaUrl);
        }
        imageUrl = JSON.stringify(choiceImageUrls);
      }
      setUploadingMedia(false);
    }
    const response = await fetch("/api/admin/exams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, prompt: isListeningTrueFalse || isListeningImageChoice || isListeningImageMatching ? "" : form.prompt, mediaUrl, imageUrl, questionNumber: Number(form.questionNumber), choices: isListeningTrueFalse ? ["ถูก", "ผิด"] : activeSection.format === "image-choice" ? ["A", "B", "C"] : isListeningImageMatching ? ["A", "B", "C", "D", "E"] : form.choices }) });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (response.ok) { setMessage("เพิ่มข้อสอบเรียบร้อย"); setShowForm(false); setAudioFile(null); setImageFile(null); setChoiceImageFiles([null, null, null, null, null]); setForm({ ...form, prompt: "", choices: ["", "", "", ""], answer: "", mediaUrl: "" }); await onSaved(); } else setMessage(data.error ?? "เพิ่มข้อสอบไม่สำเร็จ");
    setSaving(false);
  }
  const examLevels = [
    { level: "HSK 1", levelId: "hsk1", live: true, description: "ข้อสอบ 2 พาร์ต 40 ข้อ พร้อมพินอินกำกับอักษรจีน", parts: [{ name: "听力 · ฟัง", count: 20, minutes: 15 }, { name: "阅读 · อ่าน", count: 20, minutes: 17 }] },
    { level: "HSK 2", levelId: "hsk2", live: true, description: "ประโยคและบทสนทนาที่ใช้บ่อย", parts: [{ name: "ไวยากรณ์", count: 2, minutes: 10 }, { name: "อ่าน", count: 2, minutes: 10 }] },
    { level: "HSK 3", levelId: "hsk3", live: true, description: "สื่อสารเรื่องทั่วไปและข้อความสั้น", parts: [{ name: "ไวยากรณ์", count: 2, minutes: 12 }, { name: "อ่าน", count: 2, minutes: 12 }] },
    { level: "HSK 4", levelId: "hsk4", live: true, description: "เข้าใจเนื้อหาที่ซับซ้อนขึ้น", parts: [{ name: "ไวยากรณ์", count: 2, minutes: 12 }, { name: "อ่าน", count: 2, minutes: 12 }] },
    { level: "HSK 5", levelId: "hsk5", live: false, description: "อ่านข่าวและสื่อสารเชิงลึก", parts: [{ name: "ฟัง", count: 0, minutes: 30 }, { name: "อ่าน", count: 0, minutes: 45 }, { name: "เขียน", count: 0, minutes: 40 }] },
    { level: "HSK 6", levelId: "hsk6", live: false, description: "ใช้งานภาษาจีนระดับสูง", parts: [{ name: "ฟัง", count: 0, minutes: 35 }, { name: "อ่าน", count: 0, minutes: 50 }, { name: "เขียน", count: 0, minutes: 45 }] },
  ];

    const choiceCount = activeSection.format === "true-false" ? 2 : activeSection.format === "image-choice" ? 3 : isListeningImageMatching ? 5 : 4;

  if (showForm) {
    return (
      <div className="admin-content">
        <section className="admin-page-intro">
          <div><span className="admin-eyebrow">Exam Builder</span><h2>เพิ่มข้อสอบตาม Blueprint</h2><p>กรอกข้อสอบให้ตรงกับพาร์ต ส่วน และช่วงเลขข้อของระดับที่เลือก</p></div>
          <button type="button" className="admin-outline-button admin-form-close" onClick={() => setShowForm(false)}>ปิดฟอร์ม</button>
        </section>
        <section className="admin-card admin-exam-blueprint">
          <div><span className="admin-card-kicker">{form.levelId.toUpperCase()} Blueprint</span><h3>โครงสร้างข้อสอบ {form.levelId.toUpperCase()}</h3><p>{blueprint.note}</p></div>
          <div className="admin-blueprint-summary"><span><b>{blueprint.total}</b> ข้อ</span><span><b>{blueprint.minutes}</b> นาที</span><span>ผ่าน <b>{blueprint.passingScore}</b> คะแนน</span></div>
        </section>
        <form className="admin-card admin-vocabulary-form" onSubmit={createQuestion}>
          <div className="admin-form-heading"><div><span className="admin-card-kicker">Question Builder</span><h3>ข้อมูลข้อสอบ</h3></div><span className="admin-required-note">รูปแบบปัจจุบัน: {activeSection.format}</span></div>
          <div className="admin-form-grid">
            <label>ระดับ HSK<select value={form.levelId} onChange={(event) => updateLevel(event.target.value)}>{[1, 2, 3, 4, 5, 6].map((level) => <option key={level} value={`hsk${level}`}>HSK {level}</option>)}</select></label>
            <label>เลขเอกสารชุดสอบ *<input required value={form.documentId} onChange={(event) => update("documentId", event.target.value)} placeholder="เช่น H11329" /></label>
            <label>พาร์ตข้อสอบ<select value={activePart.id} onChange={(event) => updatePart(event.target.value)}>{blueprint.parts.map((part) => <option key={part.id} value={part.id}>{part.label} · {part.count} ข้อ · {part.minutes} นาที</option>)}</select></label>
            <label>ส่วนที่ / Section<select value={activeSection.id} onChange={(event) => updateSection(event.target.value)}>{activePart.sections.map((section) => <option key={section.id} value={section.id}>{section.label} · ข้อ {section.from}-{section.to}</option>)}</select></label>
            <label>รูปแบบข้อสอบ<input readOnly value={activeSection.format} /></label>
            <label>เลขข้อ *<input required type="number" min={activeSection.from} max={activeSection.to} value={form.questionNumber} onChange={(event) => updateQuestionNumber(event.target.value)} /></label>
            {!isListeningTrueFalse && !isListeningImageChoice && !isListeningImageMatching && <label className="admin-form-wide">โจทย์ / ข้อความ *<textarea required rows={3} value={form.prompt} onChange={(event) => update("prompt", event.target.value)} placeholder="พิมพ์โจทย์ พร้อมพินอินกำกับเมื่อเป็น HSK 1" /></label>}
            {!isListeningTrueFalse && (activeSection.format === "image-choice" || isListeningImageMatching ? Array.from({ length: isListeningImageMatching ? 5 : 3 }, (_, index) => index).map((index) => <label key={index}>รูปตัวเลือก {String.fromCharCode(65 + index)} *<input required type="file" accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif" onChange={(event) => setChoiceImageFiles((current) => current.map((file, fileIndex) => fileIndex === index ? (event.target.files?.[0] ?? null) : file))} /></label>) : form.choices.slice(0, choiceCount).map((choice, index) => <label key={index}>ตัวเลือก {String.fromCharCode(65 + index)} *<input required value={choice} onChange={(event) => updateChoice(index, event.target.value)} /></label>))}
            <label>คำตอบที่ถูก *<select required value={form.answer} onChange={(event) => update("answer", event.target.value)}><option value="">เลือกคำตอบ</option>{(isListeningTrueFalse ? ["ถูก", "ผิด"] : activeSection.format === "image-choice" ? ["A", "B", "C"] : isListeningImageMatching ? ["A", "B", "C", "D", "E"] : form.choices.slice(0, choiceCount).filter(Boolean)).map((choice) => <option key={choice} value={choice}>{choice}</option>)}</select></label>
            <label>แนบไฟล์เสียงเข้า R2 (ถ้ามี)<input type="file" accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,.mp3,.wav,.ogg,.m4a" onChange={(event) => setAudioFile(event.target.files?.[0] ?? null)} /></label>
            <label>แนบรูปภาพเข้า R2 (ถ้ามี)<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} /></label>
          </div>
          <div className="admin-form-actions"><span>เลขข้อที่รับได้: {activeSection.from} - {activeSection.to} · แนบเสียงครั้งเดียวในข้อแรกของพาร์ตฟัง</span><button className="admin-primary-button" type="submit" disabled={saving}>{uploadingMedia ? "กำลังอัปโหลดไฟล์..." : saving ? "กำลังบันทึก..." : "บันทึกข้อสอบ"}</button></div>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-content">
      <section className="admin-page-intro"><div><span className="admin-eyebrow">Exam Builder</span><h2>ระบบสอบ HSK</h2><p>กำหนดชุดเอกสาร พาร์ท รูปแบบ และเลขข้อให้แต่ละข้อสอบได้เอง</p></div><button type="button" className="admin-primary-button" onClick={() => setShowForm((current) => !current)}>{showForm ? "ปิดฟอร์ม" : "เพิ่มข้อสอบ"}</button></section>
      {showForm && <form className="admin-card admin-vocabulary-form" onSubmit={createQuestion}><div className="admin-form-heading"><div><span className="admin-card-kicker">Question Builder</span><h3>เพิ่มข้อสอบรายข้อ</h3></div><span className="admin-required-note">คำตอบต้องตรงกับตัวเลือก</span></div><div className="admin-form-grid"><label>ระดับ HSK<select value={form.levelId} onChange={(event) => update("levelId", event.target.value)}>{[1, 2, 3, 4, 5, 6].map((level) => <option key={level} value={`hsk${level}`}>HSK {level}</option>)}</select></label><label>เลขเอกสารชุดสอบ *<input required value={form.documentId} onChange={(event) => update("documentId", event.target.value)} placeholder="เช่น H11329" /></label><label>พาร์ท<select value={form.part} onChange={(event) => update("part", event.target.value)}><option value="listening">听力 · ฟัง</option><option value="reading">阅读 · อ่าน</option><option value="writing">书写 · เขียน</option></select></label><label>ส่วนที่ / Section *<input required value={form.section} onChange={(event) => update("section", event.target.value)} placeholder="เช่น 1" /></label><label>รูปแบบข้อสอบ<select value={form.format} onChange={(event) => update("format", event.target.value)}><option value="choice">เลือกตอบ</option><option value="true-false">ถูก / ผิด</option><option value="image-choice">เลือกภาพ</option><option value="matching">จับคู่</option><option value="fill-blank">เติมคำ</option></select></label><label>เลขข้อ *<input required type="number" min="1" value={form.questionNumber} onChange={(event) => update("questionNumber", event.target.value)} /></label><label className="admin-form-wide">โจทย์ / ข้อความ *<textarea required rows={3} value={form.prompt} onChange={(event) => update("prompt", event.target.value)} placeholder="พิมพ์โจทย์ ภาษาจีน พินอิน หรือคำแปล" /></label>{form.choices.map((choice, index) => <label key={index}>ตัวเลือก {String.fromCharCode(65 + index)} *<input required value={choice} onChange={(event) => updateChoice(index, event.target.value)} /></label>)}<label>คำตอบที่ถูก *<select required value={form.answer} onChange={(event) => update("answer", event.target.value)}><option value="">เลือกคำตอบ</option>{form.choices.filter(Boolean).map((choice) => <option key={choice} value={choice}>{choice}</option>)}</select></label><label>URL รูปภาพ (ถ้ามี)<input value={form.mediaUrl} onChange={(event) => update("mediaUrl", event.target.value)} placeholder="https://..." /></label></div><div className="admin-form-actions"><span>ใช้เลขเอกสารเดียวกันเพื่อรวมข้อสอบเป็นชุดเดียว</span><button className="admin-primary-button" type="submit" disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึกข้อสอบ"}</button></div></form>}
      <section className="admin-exam-notice"><strong>ชุดที่พร้อมใช้งาน</strong><span>HSK 1-4 มีข้อสอบ seed แล้ว ระบบจะบันทึกคะแนนลงสถิติทันทีเมื่อผู้เรียนตอบ</span></section>
      <section className="admin-exam-grid">{examLevels.map((exam) => <article className="admin-card admin-exam-card" key={exam.level}><div className="admin-exam-heading"><div><span className="admin-card-kicker">Mock Exam</span><h3>{exam.level}</h3></div><span className="admin-draft-badge">{exam.live ? "Live" : "Draft"}</span></div><p>{exam.description}</p><div className="admin-exam-parts">{exam.parts.map((part) => <div className="admin-exam-part" key={part.name}><span><strong>{part.name}</strong><small>{part.minutes} นาที</small></span><b>{part.count}<small>ข้อ</small></b></div>)}</div>{exam.live ? <a className="admin-outline-button" href={`/quiz?level=${exam.levelId}`} target="_blank" rel="noreferrer">เปิด Mock Exam</a> : <button type="button" className="admin-outline-button" disabled>รอเพิ่มข้อสอบ</button>}</article>)}</section>
      <section className="admin-card admin-table-card"><div className="admin-table-meta"><strong>ข้อสอบในระบบ {questions.length} ข้อ</strong><span>เรียงตามระดับ เอกสาร พาร์ท และเลขข้อ</span></div><div className="admin-table-scroll"><table className="admin-users-table"><thead><tr><th>ชุดเอกสาร</th><th>ระดับ / พาร์ท</th><th>ข้อ</th><th>รูปแบบ</th><th>โจทย์</th></tr></thead><tbody>{questions.map((question) => <tr key={question.id}><td><strong>{question.documentId}</strong><small>{question.section}</small></td><td>{question.levelId.toUpperCase()}<small>{question.part}</small></td><td>{question.questionNumber}</td><td>{question.format}</td><td>{question.prompt}</td></tr>)}</tbody></table>{!questions.length && <p className="admin-empty">ยังไม่มีข้อสอบที่เพิ่มจาก Admin</p>}</div></section>
    </div>
  );
}

function OverviewPanel({ overview, busy, seedHskData, syncHuggingFaceData, setActiveTab }: { overview: SystemOverview | null; busy: boolean; seedHskData: () => Promise<void>; syncHuggingFaceData: () => Promise<void>; setActiveTab: (tab: AdminTab) => void }) {
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
      <section className="admin-card admin-database-card"><div className="admin-card-heading"><div><span className="admin-card-kicker">สถานะระบบ</span><h3>ฐานข้อมูล D1</h3></div><span className="admin-status-badge"><i /> พร้อมใช้งาน</span></div><p>ฐานข้อมูลเชื่อมต่อแล้วและพร้อมเก็บข้อมูลผู้ใช้ คำศัพท์ คำถาม และผลแบบทดสอบ</p><div className="admin-binding-row"><span>Binding</span><strong>{overview?.database.binding ?? "DB"}</strong></div><div className="flex flex-wrap gap-2"><button className="admin-primary-button" type="button" onClick={seedHskData} disabled={busy}>{busy ? "กำลังเตรียมข้อมูล..." : "เตรียมข้อมูล HSK"}</button><button className="admin-outline-button" type="button" onClick={syncHuggingFaceData} disabled={busy}>{busy ? "กำลัง Sync..." : "ดึงคำศัพท์จาก Hugging Face"}</button></div></section>
        <section className="admin-card admin-actions-card"><div className="admin-card-heading"><div><span className="admin-card-kicker">การจัดการ</span><h3>ทางลัดสำหรับแอดมิน</h3></div></div><button type="button" className="admin-action-row" onClick={() => setActiveTab("users")}><span className="admin-action-icon">U</span><span><strong>จัดการผู้ใช้</strong><small>เปลี่ยนสิทธิ์ User และ Admin</small></span><b>→</b></button><a className="admin-action-row" href="/" target="_blank" rel="noreferrer"><span className="admin-action-icon">W</span><span><strong>เปิดหน้าเว็บไซต์</strong><small>ตรวจประสบการณ์ของผู้เรียน</small></span><b>↗</b></a></section>
      </div>
      <section className="admin-card admin-summary-card"><div className="admin-card-heading"><div><span className="admin-card-kicker">สรุปข้อมูล</span><h3>โครงสร้างผู้ใช้และเนื้อหา</h3></div><button type="button" className="admin-text-button" onClick={() => setActiveTab("users")}>ดูผู้ใช้ทั้งหมด →</button></div><div className="admin-summary-list"><SummaryRow label="ผู้ใช้ทั่วไป" value={overview?.users.regular ?? 0} total={overview?.users.total ?? 0} color="var(--blue)" /><SummaryRow label="คำถามแบบทดสอบ" value={overview?.content.quizQuestions ?? 0} total={overview?.content.quizQuestions ?? 0} color="var(--teal)" /><SummaryRow label="ผู้ดูแลระบบ" value={overview?.users.admins ?? 0} total={overview?.users.total ?? 0} color="var(--red)" /></div></section>
    </div>
  );
}

function UsersPanel({ users, query, setQuery, currentUserEmail, changeRole, onCreated, setMessage }: { users: AdminUser[]; query: string; setQuery: (value: string) => void; currentUserEmail: string; changeRole: (userId: string, role: "user" | "admin") => Promise<void>; onCreated: () => Promise<void>; setMessage: (message: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ displayName: "", email: "", password: "", role: "user" as "user" | "admin" });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ displayName: "", email: "", password: "", role: "user" as "user" | "admin" });
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

  function startEditing(user: AdminUser) {
    setEditingUserId(user.userId);
    setEditForm({ displayName: user.displayName, email: user.email, password: "", role: user.role });
  }

  async function saveUser(userId: string) {
    setSaving(true);
    const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", userId, ...editForm }) });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setMessage(response.ok ? "แก้ไขข้อมูลผู้ใช้เรียบร้อย" : data.error ?? "แก้ไขข้อมูลไม่สำเร็จ");
    if (response.ok) { setEditingUserId(null); await onCreated(); }
    setSaving(false);
  }

  async function toggleDisabled(user: AdminUser) {
    const action = user.disabledAt ? "เปิดใช้งาน" : "ปิดใช้งาน";
    if (!window.confirm(`${action}บัญชี ${user.displayName} หรือไม่?`)) return;
    const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "status", userId: user.userId, disabled: !user.disabledAt }) });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setMessage(response.ok ? `${action}บัญชีเรียบร้อย` : data.error ?? `${action}บัญชีไม่สำเร็จ`);
    if (response.ok) await onCreated();
  }

  async function removeUser(user: AdminUser) {
    if (!window.confirm(`ลบบัญชี ${user.displayName} อย่างถาวรหรือไม่?`)) return;
    const response = await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.userId }) });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setMessage(response.ok ? "ลบบัญชีเรียบร้อย" : data.error ?? "ลบบัญชีไม่สำเร็จ");
    if (response.ok) await onCreated();
  }

  return <div className="admin-content"><section className="admin-page-intro"><div><span className="admin-eyebrow">สิทธิ์การเข้าถึง</span><h2>จัดการผู้ใช้</h2><p>กำหนดว่าใครสามารถเข้าถึงเครื่องมือจัดการระบบได้</p></div><div className="admin-user-toolbar"><label className="admin-search"><span>ค้นหา</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ชื่อ อีเมล หรือ User ID" /></label><button type="button" className="admin-primary-button" onClick={() => setShowForm((current) => !current)}>{showForm ? "ปิดฟอร์ม" : "เพิ่มผู้ใช้"}</button></div></section>{showForm && <form className="admin-card admin-user-form" onSubmit={createUser}><label>ชื่อผู้ใช้<input required value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} /></label><label>อีเมล<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>รหัสผ่าน<input required minLength={6} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label><label>สิทธิ์<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as "user" | "admin" })}><option value="user">User</option><option value="admin">Admin</option></select></label><button className="admin-primary-button" type="submit" disabled={saving}>{saving ? "กำลังสร้าง..." : "สร้างบัญชี"}</button></form>}<section className="admin-card admin-table-card"><div className="admin-table-meta"><strong>{users.length} บัญชี</strong><span>Admin ตรวจสิทธิ์ที่ฝั่งเซิร์ฟเวอร์ทุกครั้ง</span></div><div className="admin-table-scroll"><table className="admin-users-table"><thead><tr><th>ผู้ใช้</th><th>อีเมล</th><th>สิทธิ์</th><th>สถานะ</th><th>สร้างเมื่อ</th><th>จัดการ</th></tr></thead><tbody>{users.map((item) => editingUserId === item.userId ? <tr key={item.userId} className="admin-user-edit-row"><td><input value={editForm.displayName} onChange={(event) => setEditForm({ ...editForm, displayName: event.target.value })} /></td><td><input type="email" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} /><input type="password" placeholder="รหัสผ่านใหม่ (ถ้ามี)" value={editForm.password} onChange={(event) => setEditForm({ ...editForm, password: event.target.value })} /></td><td><select value={editForm.role} onChange={(event) => setEditForm({ ...editForm, role: event.target.value as "user" | "admin" })} disabled={item.email === currentUserEmail}><option value="user">User</option><option value="admin">Admin</option></select></td><td>{item.disabledAt ? "ปิดใช้งาน" : "ใช้งานอยู่"}</td><td>{new Date(item.createdAt).toLocaleDateString("th-TH")}</td><td><div className="admin-row-actions"><button type="button" onClick={() => void saveUser(item.userId)} disabled={saving}>บันทึก</button><button type="button" onClick={() => setEditingUserId(null)}>ยกเลิก</button></div></td></tr> : <tr key={item.userId} className={item.disabledAt ? "is-disabled" : ""}><td><strong>{item.displayName}</strong><small>{item.userId}</small></td><td>{item.email}</td><td><select value={item.role} onChange={(event) => void changeRole(item.userId, event.target.value as "user" | "admin")} disabled={item.email === currentUserEmail || Boolean(item.disabledAt)}><option value="user">User</option><option value="admin">Admin</option></select></td><td><span className={`admin-user-status ${item.disabledAt ? "disabled" : "active"}`}>{item.disabledAt ? "ปิดใช้งาน" : "ใช้งานอยู่"}</span></td><td>{new Date(item.createdAt).toLocaleDateString("th-TH")}</td><td><div className="admin-row-actions"><button type="button" onClick={() => startEditing(item)}>แก้ไข</button><button type="button" onClick={() => void toggleDisabled(item)} disabled={item.email === currentUserEmail}>{item.disabledAt ? "เปิดใช้งาน" : "ปิดใช้งาน"}</button><button type="button" className="danger" onClick={() => void removeUser(item)} disabled={item.email === currentUserEmail}>ลบ</button></div></td></tr>)}</tbody></table>{!users.length && <p className="admin-empty">ไม่พบผู้ใช้ที่ค้นหา</p>}</div></section></div>;
}

function Metric({ label, value, hint, tone }: { label: string; value: number; hint: string; tone: string }) {
  return <article className={`admin-metric-card ${tone}`}><span>{label}</span><strong>{value.toLocaleString("th-TH")}</strong><small>{hint}</small></article>;
}

function SummaryRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const width = total ? Math.min(Math.max((value / total) * 100, 4), 100) : 4;
  return <div className="admin-summary-row"><div><span>{label}</span><strong>{value.toLocaleString("th-TH")}</strong></div><div className="admin-progress"><i style={{ width: `${width}%`, background: color }} /></div></div>;
}
