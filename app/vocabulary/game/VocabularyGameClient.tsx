"use client";

import { useEffect, useMemo, useState } from "react";
import { hskLevels, type VocabWord } from "../../../lib/hsk-data";

type GameState = "loading" | "playing" | "complete";
type GameQuestion = { word: VocabWord; choices: string[] };
type AnswerResult = { word: VocabWord; selected: string | null; correct: boolean; timedOut: boolean };

const QUESTION_COUNT = 10;
const QUESTION_TIME = 15;

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function buildQuestions(words: VocabWord[]) {
  const pool = shuffle(words).slice(0, Math.min(QUESTION_COUNT, words.length));
  const meanings = words.map((word) => word.thai);
  return pool.map((word): GameQuestion => ({
    word,
    choices: shuffle([word.thai, ...shuffle(meanings.filter((meaning) => meaning !== word.thai)).slice(0, 3)]),
  }));
}

export default function VocabularyGameClient() {
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [gameState, setGameState] = useState<GameState>("loading");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [levelTitle, setLevelTitle] = useState("HSK");

  const currentQuestion = questions[questionIndex];
  const score = useMemo(() => results.filter((result) => result.correct).length, [results]);

  useEffect(() => {
    let ignore = false;
    const levelId = new URLSearchParams(window.location.search).get("level") ?? "hsk1";
    const fallbackLevel = levelId === "all" ? hskLevels : hskLevels.filter((level) => level.id === levelId);

    fetch(`/api/study-data?sessionId=vocabulary-game-${levelId}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data: { levels?: typeof hskLevels } | null) => {
        if (ignore) return;
        const availableLevels = data?.levels?.length ? data.levels : fallbackLevel;
        const source = levelId === "all"
          ? availableLevels
          : availableLevels.filter((level) => level.id === levelId);
        const safeSource = source.length ? source : fallbackLevel;
        const selectedWords = safeSource.flatMap((level) => level.vocabulary);
        const selectedLevel = safeSource.find((level) => level.id === levelId);
        setLevelTitle(levelId === "all" ? "ทุกระดับ HSK" : selectedLevel?.title ?? levelId.toUpperCase());
        setQuestions(buildQuestions(selectedWords));
        setGameState("playing");
      })
      .catch(() => {
        if (ignore) return;
        const selectedWords = fallbackLevel.flatMap((level) => level.vocabulary);
        setLevelTitle(levelId === "all" ? "ทุกระดับ HSK" : fallbackLevel[0]?.title ?? "HSK");
        setQuestions(buildQuestions(selectedWords));
        setGameState("playing");
      });

    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (gameState !== "playing" || !currentQuestion) return;
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          submitAnswer(null);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [gameState, questionIndex, currentQuestion]);

  function submitAnswer(selected: string | null) {
    if (!currentQuestion) return;
    const result: AnswerResult = {
      word: currentQuestion.word,
      selected,
      correct: selected === currentQuestion.word.thai,
      timedOut: selected === null,
    };
    setResults((current) => [...current, result]);
    if (questionIndex >= questions.length - 1) {
      setGameState("complete");
    } else {
      setQuestionIndex((current) => current + 1);
      setTimeLeft(QUESTION_TIME);
    }
  }

  function restart() {
    setQuestions((current) => buildQuestions(current.map((question) => question.word)));
    setQuestionIndex(0);
    setTimeLeft(QUESTION_TIME);
    setResults([]);
    setGameState("playing");
  }

  if (gameState === "loading") {
    return <main className="vocabulary-game-page"><p className="vocabulary-game-loading">กำลังเตรียมเกม...</p></main>;
  }

  if (gameState === "complete") {
    const wrongAnswers = results.filter((result) => !result.correct);
    return (
      <main className="vocabulary-game-page">
        <section className="vocabulary-game-summary">
          <span className="vocabulary-game-kicker">จบเกมแล้ว · {levelTitle}</span>
          <h1>คะแนนของคุณ</h1>
          <div className="vocabulary-game-score">{score}<small> / {questions.length}</small></div>
          <p className="vocabulary-game-score-note">ตอบถูก {score} ข้อ จากทั้งหมด {questions.length} ข้อ</p>

          {wrongAnswers.length > 0 ? (
            <div className="vocabulary-game-review">
              <h2>ทบทวนข้อที่ตอบผิด</h2>
              {wrongAnswers.map((result) => (
                <article className="vocabulary-game-mistake" key={result.word.id}>
                  <div className="vocabulary-game-mistake-word"><strong>{result.word.hanzi}</strong><span>{result.word.pinyin}</span></div>
                  <p>คำตอบที่ถูก: <b>{result.word.thai}</b></p>
                  <p>{result.timedOut ? "หมดเวลา ไม่ได้เลือกคำตอบ" : `คุณเลือก: ${result.selected}`}</p>
                  <small>ตัวอย่าง: {result.word.example}{result.word.exampleThai ? ` · ${result.word.exampleThai}` : ""}</small>
                </article>
              ))}
            </div>
          ) : <p className="vocabulary-game-perfect">ยอดเยี่ยม คุณตอบถูกทุกข้อ</p>}

          <div className="vocabulary-game-summary-actions">
            <button type="button" onClick={restart}>เล่นอีกครั้ง</button>
            <a href="/vocabulary">กลับคลังคำศัพท์</a>
          </div>
        </section>
      </main>
    );
  }

  const progress = ((questionIndex + 1) / questions.length) * 100;
  const timeProgress = (timeLeft / QUESTION_TIME) * 100;
  return (
    <main className="vocabulary-game-page">
      <section className="vocabulary-game-card">
        <div className="vocabulary-game-topline"><span>{levelTitle}</span><span>ข้อ {questionIndex + 1} / {questions.length}</span></div>
        <div className="vocabulary-game-progress"><i style={{ width: `${progress}%` }} /></div>
        <div className="vocabulary-game-timer"><span>เวลาข้อนี้</span><strong>{timeLeft}s</strong></div>
        <div className="vocabulary-game-timebar"><i className={timeLeft <= 5 ? "is-danger" : ""} style={{ width: `${timeProgress}%` }} /></div>
        <div className="vocabulary-game-prompt"><span>คำนี้แปลว่าอะไร?</span><strong>{currentQuestion?.word.hanzi}</strong><small>{currentQuestion?.word.pinyin}</small></div>
        <div className="vocabulary-game-choices">
          {currentQuestion?.choices.map((choice) => <button type="button" key={choice} onClick={() => submitAnswer(choice)}>{choice}</button>)}
        </div>
      </section>
    </main>
  );
}
