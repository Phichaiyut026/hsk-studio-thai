"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SpeakButton from "../components/SpeakButton";
import type { Level, VocabWord } from "../../lib/hsk-data";

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

const levelSummaries = [
  "พื้นฐานชีวิตประจำวัน",
  "สื่อสารง่ายขึ้น",
  "ต่อประโยคได้คล่อง",
  "อ่านและตอบโต้มากขึ้น",
  "ใช้ภาษาเชิงลึก",
  "ใกล้ระดับใช้งานจริง",
];

export default function VocabularyClient({ authPaths, user, isAdmin }: Props) {
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<string>("");
  const [isLoadingLevels, setIsLoadingLevels] = useState(true);
  const [mode, setMode] = useState<"flashcard" | "list">("flashcard");
  const [listPage, setListPage] = useState(1);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [masteredWords, setMasteredWords] = useState<string[]>([]);
  const [toolsOpen, setToolsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("hsk-mastered-words");
      if (saved) setMasteredWords(JSON.parse(saved));
    } catch {
      // Ignore unavailable or malformed local progress.
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    setIsLoadingLevels(true);
    fetch("/api/study-data?sessionId=vocabulary")
      .then((response) => response.ok ? response.json() : null)
      .then((data: { levels?: Level[] } | null) => {
        if (!ignore && data?.levels?.length) setLevels(data.levels);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!ignore) setIsLoadingLevels(false);
      });
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".vocabulary-page");
    if (!page) return;

    let frame = 0;
    function handlePointerMove(event: PointerEvent) {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        page.style.setProperty("--cursor-x", `${event.clientX}px`);
        page.style.setProperty("--cursor-y", `${event.clientY}px`);
        frame = 0;
      });
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const currentLevel = useMemo<Level | null>(() => {
    return levels.find((l) => l.id === selectedLevelId) || null;
  }, [levels, selectedLevelId]);

  const wordsForLevel = useMemo(() => {
    return currentLevel?.vocabulary ?? [];
  }, [currentLevel]);

  // Filtered words for list view and flashcard view
  const filteredWords = useMemo(() => {
    return wordsForLevel.filter((w) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        w.hanzi.includes(searchQuery) ||
        w.pinyin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.thai.includes(searchQuery);

      const matchesCat =
        selectedCategory === "all" || w.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [wordsForLevel, searchQuery, selectedCategory]);

  const listPageSize = 36;
  const listTotalPages = Math.max(1, Math.ceil(filteredWords.length / listPageSize));
  const visibleWords = filteredWords.slice((listPage - 1) * listPageSize, listPage * listPageSize);

  useEffect(() => {
    setListPage(1);
  }, [selectedLevelId, searchQuery, selectedCategory]);

  useEffect(() => {
    setCardIndex(0);
    setFlipped(false);
  }, [selectedLevelId, searchQuery, selectedCategory]);

  useEffect(() => {
    if (listPage > listTotalPages) setListPage(listTotalPages);
  }, [listPage, listTotalPages]);

  const activeWord: VocabWord | undefined = filteredWords[cardIndex] || filteredWords[0];

  function handleNextCard() {
    if (filteredWords.length === 0) return;
    setCardIndex((prev) => (prev + 1) % filteredWords.length);
    setFlipped(false);
  }

  function handleShuffle() {
    if (filteredWords.length <= 1) return;
    const randomIndex = Math.floor(Math.random() * filteredWords.length);
    setCardIndex(randomIndex);
    setFlipped(false);
  }

  function toggleMastered(wordId: string) {
    setMasteredWords((prev) => {
      const next = prev.includes(wordId)
        ? prev.filter((id) => id !== wordId)
        : [...prev, wordId];
      try {
        window.localStorage.setItem("hsk-mastered-words", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  // Keyboard navigation for flashcards
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (mode !== "flashcard") return;
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNextCard();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="app-page vocabulary-page min-h-screen text-[var(--ink)] flex flex-col justify-between">
      <div>
        <Navbar authPaths={authPaths} user={user} isAdmin={isAdmin} />

        <main className="vocabulary-shell">
          {!selectedLevelId && (
            <div className="vocabulary-hero">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100/70 text-[var(--red)] text-xs font-bold uppercase tracking-wider mb-2">
                คำศัพท์ & แฟลชการ์ด
              </div>
              <h1>
                คลังคำศัพท์ HSK
              </h1>
              <p>
                เลือกระดับ แล้วเริ่มทบทวนคำศัพท์ ฟังเสียง หรือเล่นเกมของระดับนั้น
              </p>
            </div>
          )}

          {!selectedLevelId && (
            <section className="vocabulary-level-overview" aria-label="เลือกระดับ HSK">
              {isLoadingLevels ? (
                <div className="vocabulary-empty-state">กำลังโหลดระดับคำศัพท์...</div>
              ) : levels.length > 0 ? (
                levels.map((lvl, index) => {
                  const masteredInLevel = lvl.vocabulary.filter((word) => masteredWords.includes(word.id)).length;
                  const totalWords = lvl.vocabulary.length;
                  const percent = totalWords ? Math.round((masteredInLevel / totalWords) * 100) : 0;
                  const summary = levelSummaries[index] ?? "ทบทวนคำศัพท์";
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setSelectedLevelId(lvl.id)}
                      className="vocabulary-level-choice"
                      style={{ "--level-accent": lvl.color || "#dd4b39" } as CSSProperties}
                    >
                      <span className="vocabulary-level-watermark" aria-hidden="true">
                        {index + 1}
                      </span>
                      <span className="vocabulary-level-orb">{index + 1}</span>
                      <span className="vocabulary-level-main">
                        <span className="vocabulary-level-kicker">ระดับคำศัพท์</span>
                        <strong>{lvl.title}</strong>
                        <small>{summary}</small>
                      </span>
                      <span className="vocabulary-level-meta">
                        <span>{totalWords.toLocaleString("th-TH")} คำ</span>
                        <span>{masteredInLevel.toLocaleString("th-TH")} จำได้แล้ว</span>
                      </span>
                      <span className="vocabulary-level-progress" aria-label={`จำได้แล้ว ${percent}%`}>
                        <i style={{ width: `${percent}%` }} />
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="vocabulary-empty-state">
                  ยังไม่มีคำศัพท์ในฐานข้อมูล ไปเพิ่มคำศัพท์ในหน้า Admin ก่อนครับ
                </div>
              )}
            </section>
          )}

          {selectedLevelId && currentLevel && (
            <>
          <section className="vocabulary-level-detail">
            <button type="button" onClick={() => setSelectedLevelId("")} className="vocabulary-back-button">
              ← เลือกระดับ HSK อื่น
            </button>
            <div className="vocabulary-detail-heading">
              <div>
                <span>กำลังทบทวน</span>
                <h2>{currentLevel.title}</h2>
                <p>เลือกโหมด แล้วเริ่มทบทวนคำศัพท์</p>
              </div>
              <div className="vocabulary-detail-count">
                <strong>{wordsForLevel.length.toLocaleString("th-TH")}</strong>
                <span>คำศัพท์</span>
              </div>
            </div>
          </section>

          <aside className="vocabulary-toolbar" aria-label="เครื่องมือคำศัพท์">
            <button
              type="button"
              className="vocabulary-tools-toggle"
              onClick={() => setToolsOpen((open) => !open)}
              aria-expanded={toolsOpen}
            >
              <span>เครื่องมือ</span>
              <strong>{toolsOpen ? "ปิด" : "เปิด"}</strong>
            </button>
            <div className={`vocabulary-tools-panel ${toolsOpen ? "is-open" : ""}`}>
              <a
                href={`/vocabulary/game?level=${encodeURIComponent(selectedLevelId)}`}
                className="vocabulary-game-launch"
              >
                <span aria-hidden="true">▶</span>
                <span>เริ่มเกมทบทวน</span>
              </a>
              <div className="vocabulary-tool-group">
                <button
                  type="button"
                  onClick={() => {
                    setMode("flashcard");
                    setToolsOpen(false);
                  }}
                  className={`vocabulary-tool-button ${mode === "flashcard" ? "is-active" : ""}`}
                >
                  <span>โหมดบัตรคำ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("list");
                    setToolsOpen(false);
                  }}
                  className={`vocabulary-tool-button ${mode === "list" ? "is-active" : ""}`}
                >
                  <span>โหมดตารางคำศัพท์</span>
                </button>
              </div>

              <div className="vocabulary-tool-group">
                {["all", "คำนาม", "คำกริยา", "คำคุณศัพท์", "คำเชื่อม"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCardIndex(0);
                      setToolsOpen(false);
                    }}
                    className={`vocabulary-tool-button ${selectedCategory === cat ? "is-active" : ""}`}
                  >
                    {cat === "all" ? "หมวดหมู่ทั้งหมด" : cat}
                  </button>
                ))}
              </div>

              <div className="vocabulary-tool-search">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCardIndex(0);
                  }}
                  placeholder="ค้นหาตัวจีน, พินอิน หรือคำแปลไทย..."
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                  >
                    ล้าง
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* MODE 1: FLASHCARD VIEW */}
          {mode === "flashcard" && (
            <div className="max-w-2xl mx-auto">
              {filteredWords.length > 0 && activeWord ? (
                <div>
                  {/* Card status info */}
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--muted)] mb-3 px-1">
                    <span>
                      คำที่ {cardIndex + 1} จากทั้งหมด {filteredWords.length} คำ
                    </span>
                    <div className="flex items-center gap-2">
                      {activeWord.category && (
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px]">
                          {activeWord.category}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400">
                        (กด Space เพื่อพลิกการ์ด)
                      </span>
                    </div>
                  </div>

                  {/* Flip Card Button */}
                  <section className={`vocab-flip-stage ${flipped ? "is-flipped" : ""}`}>
                    <button
                      type="button"
                      onClick={() => setFlipped(!flipped)}
                      className="vocab-flip-card"
                      aria-label="พลิกบัตรคำศัพท์"
                    >
                      <span className="vocab-card-face vocab-card-front">
                        <span className="vocab-card-kicker">ตัวอักษรจีน & พินอิน</span>
                        <span className="vocab-card-hanzi">{activeWord.hanzi}</span>
                        <span className="vocab-card-pinyin">{activeWord.pinyin}</span>
                        <span className="vocab-card-hint">แตะการ์ดเพื่อดูความหมาย</span>
                      </span>
                      <span className="vocab-card-face vocab-card-back">
                        <span className="vocab-card-kicker">คำแปลและความหมาย</span>
                        <span className="vocab-card-meaning">{activeWord.thai}</span>
                        <span className="vocab-card-pair">
                          {activeWord.hanzi} · {activeWord.pinyin}
                        </span>
                        {activeWord.example && (
                          <span className="vocab-card-example">
                            <b>ตัวอย่าง</b>
                            <span>{activeWord.example}</span>
                            {activeWord.examplePinyin && <small>{activeWord.examplePinyin}</small>}
                            {activeWord.exampleThai && <em>{activeWord.exampleThai}</em>}
                          </span>
                        )}
                      </span>
                    </button>

                    <div className="vocab-card-toolbar">
                      <div className="vocab-audio-actions">
                        <SpeakButton
                          text={activeWord.hanzi}
                          label="ฟังเสียงคำนี้"
                          className="vocab-audio-button"
                        />
                        {activeWord.example && (
                          <SpeakButton
                            text={activeWord.example}
                            label="ฟังประโยคตัวอย่าง"
                            className="vocab-audio-button"
                          />
                        )}
                      </div>
                      <div className="vocab-card-actions">
                        <button
                          type="button"
                          onClick={() => toggleMastered(activeWord.id)}
                          className={`vocab-mastery-button ${
                            masteredWords.includes(activeWord.id) ? "is-mastered" : ""
                          }`}
                        >
                          {masteredWords.includes(activeWord.id)
                            ? "จำได้แล้ว"
                            : "ทำเครื่องหมายว่าจำได้"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setFlipped(!flipped)}
                          className="vocab-flip-action"
                        >
                          พลิกการ์ด
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* Forward Navigation controls */}
                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <button
                      type="button"
                      onClick={handleShuffle}
                      className="py-3 px-4 rounded-xl bg-white border border-[var(--line)] hover:bg-gray-50 text-[var(--ink)] font-bold text-sm shadow-xs transition-transform active:scale-95"
                    >
                      สุ่มคำ
                    </button>
                    <button
                      type="button"
                      onClick={handleNextCard}
                      className="py-3 px-4 rounded-xl bg-[var(--ink)] hover:bg-black text-white font-bold text-sm shadow-sm transition-transform active:scale-95"
                    >
                      คำถัดไป
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-[var(--paper)] rounded-2xl border border-[var(--line)]">
                  <p className="text-xl font-bold text-[var(--muted)]">
                    ไม่พบคำศัพท์ที่ตรงกับการค้นหา &quot;{searchQuery}&quot;
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="mt-4 px-4 py-2 bg-[var(--ink)] text-white rounded-lg text-sm font-bold"
                  >
                    ล้างตัวกรอง
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: FULL LIST VIEW */}
          {mode === "list" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm font-bold text-[var(--muted)]">
                <span>พบ {filteredWords.length} คำศัพท์</span>
                <span>
                  จำได้แล้ว: {masteredWords.length} / {filteredWords.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleWords.map((word) => {
                  const isMastered = masteredWords.includes(word.id);
                  return (
                    <div
                      key={word.id}
                      className="p-5 rounded-2xl bg-[var(--paper)] border border-[var(--line)] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-3xl font-black text-[var(--ink)]">
                            {word.hanzi}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <SpeakButton text={word.hanzi} label="ฟัง" className="vocab-mini-audio-button" />
                            {word.category && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">
                                {word.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-bold text-[var(--muted)] mb-1">
                          {word.pinyin}
                        </p>
                        <p className="text-base font-bold text-[var(--teal)] mb-3">
                          {word.thai}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[var(--line)]/60 text-xs">
                        <p className="font-semibold text-gray-700">{word.example}</p>
                        {word.exampleThai && (
                          <p className="text-gray-500 mt-0.5">{word.exampleThai}</p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => toggleMastered(word.id)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-md transition-colors ${
                              isMastered
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {isMastered ? "จำได้แล้ว" : "ทำเครื่องหมาย"}
                          </button>
                          <SpeakButton
                            text={word.example}
                            label="ฟังประโยค"
                            className="vocab-mini-audio-button"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-sm font-bold text-[var(--muted)]">
                <span>แสดง {visibleWords.length} จาก {filteredWords.length.toLocaleString("th-TH")} คำ</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setListPage((current) => Math.max(1, current - 1))} disabled={listPage === 1} className="px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] disabled:opacity-40">ก่อนหน้า</button>
                  <span>หน้า {listPage} / {listTotalPages}</span>
                  <button type="button" onClick={() => setListPage((current) => Math.min(listTotalPages, current + 1))} disabled={listPage === listTotalPages} className="px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] disabled:opacity-40">ถัดไป</button>
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </main>
      </div>

      <Footer isAdmin={isAdmin} />
    </div>
  );
}
