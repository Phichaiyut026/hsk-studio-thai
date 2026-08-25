"use client";

import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SpeakButton, { speakChinese } from "../components/SpeakButton";
import { hskLevels } from "../../lib/hsk-data";

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

export default function LessonsClient({ authPaths, user, isAdmin }: Props) {
  const [selectedLevelId, setSelectedLevelId] = useState<string>("hsk1");

  const activeLevel = useMemo(() => {
    return hskLevels.find((l) => l.id === selectedLevelId) || hskLevels[0];
  }, [selectedLevelId]);

  return (
    <div className="app-page min-h-screen text-[var(--ink)] flex flex-col justify-between">
      <div>
        <Navbar authPaths={authPaths} user={user} isAdmin={isAdmin} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 text-[var(--blue)] text-xs font-bold uppercase tracking-wider mb-2">
              บทเรียน & ไวยากรณ์
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--ink)]">
              บทเรียนและไวยากรณ์ HSK
            </h1>
            <p className="text-[var(--muted)] text-base mt-2 max-w-2xl">
              เรียนรู้โครงสร้างไวยากรณ์ภาษาจีนแบบเข้าใจง่าย
              พร้อมบทสนทนาจำลองในสถานการณ์จริง และฝึกฟังเสียงเจ้าของภาษา
            </p>
          </div>

          {/* Level Tabs */}
          <div className="flex flex-wrap gap-2.5 mb-8">
            {hskLevels.map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setSelectedLevelId(lvl.id)}
                className={`px-5 py-3 rounded-xl font-bold text-sm transition-all border ${
                  selectedLevelId === lvl.id
                    ? "bg-[var(--ink)] text-white border-[var(--ink)] shadow-md scale-102"
                    : "bg-[var(--paper)] text-[var(--ink)] border-[var(--line)] hover:border-black/30"
                }`}
              >
                <span>{lvl.title}</span>
                <span className="ml-2 text-xs font-normal opacity-80">
                  {lvl.target}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Main Lesson Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Lesson Overview Banner */}
              <div
                className="p-6 sm:p-8 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xs relative overflow-hidden"
                style={{ borderLeft: `6px solid ${activeLevel.color}` }}
              >
                <span className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">
                  {activeLevel.title} • บทเรียนหลัก
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[var(--ink)] mt-1 mb-2">
                  {activeLevel.lesson.title}
                </h2>
                <p className="text-sm font-semibold text-[var(--muted)] leading-relaxed">
                  <strong>เป้าหมายบทนี้:</strong> {activeLevel.focus}
                </p>
              </div>

              {/* Grammar Breakdown */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-[var(--ink)]">
                    จุดเน้นไวยากรณ์ (Grammar Focus)
                  </h3>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-sm">
                  <span className="font-bold text-blue-900 block mb-1">
                    กฎสำคัญ:
                  </span>
                  <p className="text-blue-950 font-bold text-base">
                    {activeLevel.lesson.grammar}
                  </p>
                </div>

                {activeLevel.lesson.grammarDetail && (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-[var(--line)] text-sm leading-relaxed text-gray-700">
                    <p>{activeLevel.lesson.grammarDetail}</p>
                  </div>
                )}
              </div>

              {/* Interactive Dialogue */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-[var(--ink)]">
                      บทสนทนาตัวอย่าง (Dialogue)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeLevel.lesson.dialogLines) {
                        const fullText = activeLevel.lesson.dialogLines
                          .map((l) => l.hanzi)
                          .join(" ");
                        speakChinese(fullText);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--teal)]/10 text-[var(--teal)] hover:bg-[var(--teal)]/20 text-xs font-bold transition-colors"
                  >
                    <span>ฟังบทสนทนาทั้งหมด</span>
                  </button>
                </div>

                {/* Dialogue Lines */}
                <div className="space-y-3">
                  {activeLevel.lesson.dialogLines ? (
                    activeLevel.lesson.dialogLines.map((line, idx) => {
                      const isSpeakerA = line.speaker === "A";
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-2xl border transition-all ${
                            isSpeakerA
                              ? "bg-amber-50/60 border-amber-200/80 ml-0 mr-4"
                              : "bg-teal-50/60 border-teal-200/80 ml-4 mr-0"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                                  isSpeakerA
                                    ? "bg-amber-500 text-white"
                                    : "bg-teal-600 text-white"
                                }`}
                              >
                                {line.speaker}
                              </span>
                              <span className="text-lg font-black text-[var(--ink)]">
                                {line.hanzi}
                              </span>
                            </div>
                            <SpeakButton
                              text={line.hanzi}
                              label="ฟัง"
                              className="p-1.5 text-xs bg-white"
                            />
                          </div>
                          <p className="text-xs font-medium text-[var(--muted)] mt-1 ml-8">
                            {line.pinyin}
                          </p>
                          <p className="text-xs font-bold text-gray-700 mt-1 ml-8">
                            {line.thai}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-50 font-bold whitespace-pre-line text-sm">
                      {activeLevel.lesson.dialog}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Key phrases & Level Vocab preview */}
            <div className="space-y-6">
              {/* Key Phrases Card */}
              <div className="p-6 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xs space-y-4">
                <h3 className="text-lg font-black text-[var(--ink)] flex items-center gap-2">
                  <span>ประโยคสำคัญประจำบท</span>
                </h3>
                <div className="space-y-3">
                  {activeLevel.lesson.keyPhrases?.map((phrase, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-white border border-[var(--line)] flex flex-col justify-between gap-1 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-base text-[var(--ink)]">
                          {phrase.hanzi}
                        </span>
                        <SpeakButton
                          text={phrase.hanzi}
                          label="ฟัง"
                          className="p-1 text-xs"
                        />
                      </div>
                      <span className="text-xs font-medium text-[var(--muted)]">
                        {phrase.pinyin}
                      </span>
                      <span className="text-xs font-bold text-[var(--teal)]">
                        {phrase.thai}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vocab Preview for this level */}
              <div className="p-6 rounded-3xl bg-[var(--paper)] border border-[var(--line)] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-[var(--ink)] flex items-center gap-2">
                    <span>คำศัพท์ในบท ({activeLevel.vocabulary.length} คำ)</span>
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {activeLevel.vocabulary.map((vocab) => (
                    <div
                      key={vocab.id}
                      className="p-2.5 rounded-xl bg-white border border-[var(--line)] flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-lg text-[var(--ink)]">
                          {vocab.hanzi}
                        </span>
                        <SpeakButton
                          text={vocab.hanzi}
                          label=""
                          className="p-1 text-[10px]"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-[var(--muted)]">
                        {vocab.pinyin}
                      </span>
                      <span className="text-xs font-bold text-[var(--teal)] truncate">
                        {vocab.thai}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer isAdmin={isAdmin} />
    </div>
  );
}
