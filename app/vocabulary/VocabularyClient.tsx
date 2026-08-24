"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SpeakButton from "../components/SpeakButton";
import { hskLevels, type VocabWord } from "../../lib/hsk-data";

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

export default function VocabularyClient({ authPaths, user }: Props) {
  const [selectedLevelId, setSelectedLevelId] = useState<string>("hsk1");
  const [mode, setMode] = useState<"flashcard" | "list">("flashcard");
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [masteredWords, setMasteredWords] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem("hsk-mastered-words");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const currentLevel = useMemo(() => {
    return hskLevels.find((l) => l.id === selectedLevelId) || hskLevels[0];
  }, [selectedLevelId]);

  // All words across levels or within selected level
  const wordsForLevel = useMemo(() => {
    if (selectedLevelId === "all") {
      return hskLevels.flatMap((l) => l.vocabulary);
    }
    return currentLevel.vocabulary;
  }, [selectedLevelId, currentLevel]);

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
    <div className="min-h-screen bg-[var(--page)] text-[var(--ink)] flex flex-col justify-between">
      <div>
        <Navbar authPaths={authPaths} user={user} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100/70 text-[var(--red)] text-xs font-bold uppercase tracking-wider mb-2">
              คำศัพท์ & แฟลชการ์ด
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--ink)]">
              คลังคำศัพท์และบัตรคำ HSK
            </h1>
            <p className="text-[var(--muted)] text-base mt-2 max-w-2xl">
              ทบทวนคำศัพท์ภาษาจีนพร้อมระบบออกเสียง ตัวอย่างประโยค แปลไทย
              และโหมดสลับดูทั้งแบบบัตรคำทบทวน หรือค้นหาในตารางคำศัพท์
            </p>
          </div>

          {/* Level Selector Tabs */}
          <div className="flex flex-wrap gap-2.5 mb-6">
            {hskLevels.map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => {
                  setSelectedLevelId(lvl.id);
                  setCardIndex(0);
                  setFlipped(false);
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                  selectedLevelId === lvl.id
                    ? "bg-[var(--ink)] text-white border-[var(--ink)] shadow-sm scale-102"
                    : "bg-[var(--paper)] text-[var(--ink)] border-[var(--line)] hover:border-black/30"
                }`}
              >
                {lvl.title}{" "}
                <span className="opacity-70 text-xs font-normal">
                  ({lvl.vocabulary.length} คำ)
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setSelectedLevelId("all");
                setCardIndex(0);
                setFlipped(false);
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                selectedLevelId === "all"
                  ? "bg-[var(--ink)] text-white border-[var(--ink)] shadow-sm scale-102"
                  : "bg-[var(--paper)] text-[var(--ink)] border-[var(--line)] hover:border-black/30"
              }`}
            >
              รวมทุกระดับ
            </button>
          </div>

          {/* Controls Bar: Mode toggle & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--paper)] border border-[var(--line)] mb-8 shadow-xs">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-black/5 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setMode("flashcard")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mode === "flashcard"
                    ? "bg-white text-[var(--ink)] shadow-xs"
                    : "text-[var(--muted)] hover:text-black"
                }`}
              >
                <span>โหมดบัตรคำ</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("list")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mode === "list"
                    ? "bg-white text-[var(--ink)] shadow-xs"
                    : "text-[var(--muted)] hover:text-black"
                }`}
              >
                <span>โหมดตารางคำศัพท์</span>
              </button>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {["all", "คำนาม", "คำกริยา", "คำคุณศัพท์", "คำเชื่อม"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCardIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    selectedCategory === cat
                      ? "bg-[var(--ink)] text-white"
                      : "bg-white border border-[var(--line)] text-[var(--muted)] hover:text-black"
                  }`}
                >
                  {cat === "all" ? "หมวดหมู่ทั้งหมด" : cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCardIndex(0);
                }}
                placeholder="ค้นหาตัวจีน, พินอิน หรือคำแปลไทย..."
                className="w-full px-4 py-2 text-sm bg-white border border-[var(--line)] rounded-xl focus:outline-none focus:border-[var(--ink)] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black text-xs font-bold"
                >
                  ล้าง
                </button>
              )}
            </div>
          </div>

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
                  <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] shadow-lg min-h-[380px] p-8 flex flex-col justify-between items-center transition-all hover:shadow-xl relative overflow-hidden group">
                    <button
                      type="button"
                      onClick={() => setFlipped(!flipped)}
                      className="w-full flex-1 flex flex-col items-center justify-center cursor-pointer text-center"
                      aria-label="พลิกบัตรคำศัพท์"
                    >
                      {!flipped ? (
                        /* FRONT SIDE */
                        <div className="w-full flex flex-col items-center justify-center gap-4">
                          <span className="text-xs font-bold text-[var(--muted)] tracking-wider">
                            ตัวอักษรจีน & พินอิน (แตะเพื่อดูความหมาย)
                          </span>
                          <span className="text-6xl sm:text-7xl font-black text-[var(--ink)] tracking-wide group-hover:scale-105 transition-transform block">
                            {activeWord.hanzi}
                          </span>
                          <span className="text-xl sm:text-2xl font-semibold text-[var(--muted)] tracking-widest block">
                            {activeWord.pinyin}
                          </span>
                        </div>
                      ) : (
                        /* BACK SIDE */
                        <div className="w-full flex flex-col items-center justify-center gap-4">
                          <span className="text-xs font-bold text-[var(--teal)] tracking-wider">
                            คำแปลและความหมาย
                          </span>
                          <span className="text-3xl sm:text-4xl font-black text-[var(--teal)] block">
                            {activeWord.thai}
                          </span>
                          <span className="text-sm text-[var(--muted)] block">
                            {activeWord.hanzi} ({activeWord.pinyin})
                          </span>
                        </div>
                      )}
                    </button>

                    {/* Audio & Example controls */}
                    <div className="w-full flex flex-col items-center gap-3 pt-3">
                      <div className="flex items-center gap-2">
                        <SpeakButton
                          text={activeWord.hanzi}
                          label="ฟังเสียงคำนี้"
                          className="bg-white px-4 py-2 text-sm"
                        />
                        {activeWord.example && (
                          <SpeakButton
                            text={activeWord.example}
                            label="ฟังประโยคตัวอย่าง"
                            className="bg-white px-4 py-2 text-sm"
                          />
                        )}
                      </div>

                      {flipped && activeWord.example && (
                        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-left w-full max-w-lg">
                          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1">
                            ตัวอย่างประโยค:
                          </span>
                          <p className="text-base font-bold text-amber-950">
                            {activeWord.example}
                          </p>
                          {activeWord.examplePinyin && (
                            <p className="text-xs font-medium text-amber-800 mt-0.5">
                              {activeWord.examplePinyin}
                            </p>
                          )}
                          {activeWord.exampleThai && (
                            <p className="text-xs text-amber-900/80 mt-1">
                              {activeWord.exampleThai}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom action inside card */}
                    <div className="w-full flex items-center justify-between pt-4 border-t border-[var(--line)]/50 mt-4 text-xs">
                      <button
                        type="button"
                        onClick={() => toggleMastered(activeWord.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          masteredWords.includes(activeWord.id)
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {masteredWords.includes(activeWord.id)
                          ? "จำได้แล้ว"
                          : "ทำเครื่องหมายว่าจำได้"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFlipped(!flipped)}
                        className="text-[var(--muted)] font-semibold hover:text-black"
                      >
                        แตะเพื่อพลิกการ์ด
                      </button>
                    </div>
                  </div>

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
                {filteredWords.map((word) => {
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
                            <SpeakButton text={word.hanzi} label="ฟัง" className="p-1.5" />
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
                            className="text-[10px] py-1"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
