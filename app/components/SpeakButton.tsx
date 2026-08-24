"use client";

import { useState } from "react";

export function speakChinese(text: string) {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.85; // Slightly slower for clear learning
    window.speechSynthesis.speak(utterance);
  }
}

export default function SpeakButton({
  text,
  label = "ฟังเสียง",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [speaking, setSpeaking] = useState(false);

  function handleSpeak(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.85;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSpeak}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--line)] bg-white/70 hover:bg-white text-[var(--ink)] text-xs font-bold transition-all shadow-xs active:scale-95 ${className}`}
      title="กดฟังเสียงอ่านภาษาจีน"
      aria-label={`ฟังเสียงอ่าน ${text}`}
    >
      <span className={speaking ? "animate-pulse" : ""}>{speaking ? "กำลังฟัง" : label}</span>
    </button>
  );
}
