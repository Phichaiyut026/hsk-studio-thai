"use client";

import { useMemo, useState } from "react";

type Level = {
  id: string;
  title: string;
  words: number;
  target: string;
  color: string;
  focus: string;
  vocabulary: Array<{
    hanzi: string;
    pinyin: string;
    thai: string;
    example: string;
  }>;
  lesson: {
    title: string;
    grammar: string;
    dialog: string;
  };
  quiz: {
    prompt: string;
    answer: string;
    choices: string[];
  };
};

const levels: Level[] = [
  {
    id: "hsk1",
    title: "HSK 1",
    words: 150,
    target: "เริ่มพูดประโยคสั้นในชีวิตประจำวัน",
    color: "#dd4b39",
    focus: "ทักทาย ตัวเลข เวลา ครอบครัว และคำถามพื้นฐาน",
    vocabulary: [
      { hanzi: "你好", pinyin: "ni hao", thai: "สวัสดี", example: "你好，我叫明。" },
      { hanzi: "谢谢", pinyin: "xie xie", thai: "ขอบคุณ", example: "谢谢你帮我。" },
      { hanzi: "学习", pinyin: "xue xi", thai: "เรียน", example: "我学习汉语。" },
      { hanzi: "朋友", pinyin: "peng you", thai: "เพื่อน", example: "她是我的朋友。" },
    ],
    lesson: {
      title: "บทสนทนาพบกันครั้งแรก",
      grammar: "ใช้ 是 เพื่อบอกว่าใครเป็นใคร เช่น 我是学生",
      dialog: "A: 你叫什么名字? B: 我叫安娜。很高兴认识你。",
    },
    quiz: {
      prompt: "คำว่า 朋友 หมายถึงอะไร",
      answer: "เพื่อน",
      choices: ["เพื่อน", "หนังสือ", "ร้านอาหาร", "วันพรุ่งนี้"],
    },
  },
  {
    id: "hsk2",
    title: "HSK 2",
    words: 300,
    target: "คุยเรื่องงานอดิเรก การเดินทาง และแผนง่าย ๆ",
    color: "#f29f05",
    focus: "คำกริยาถี่ขึ้น ประโยคเปรียบเทียบ และคำบอกเวลา",
    vocabulary: [
      { hanzi: "因为", pinyin: "yin wei", thai: "เพราะว่า", example: "因为下雨，我不去。" },
      { hanzi: "觉得", pinyin: "jue de", thai: "รู้สึกว่า", example: "我觉得中文很有意思。" },
      { hanzi: "运动", pinyin: "yun dong", thai: "ออกกำลังกาย", example: "你喜欢什么运动?" },
      { hanzi: "旅游", pinyin: "lu you", thai: "ท่องเที่ยว", example: "我们明年去旅游。" },
    ],
    lesson: {
      title: "บอกเหตุผลและความคิดเห็น",
      grammar: "ใช้ 因为...所以... เพื่อเชื่อมเหตุและผล",
      dialog: "A: 你为什么学习汉语? B: 因为我想去中国旅游。",
    },
    quiz: {
      prompt: "ประโยคใดใช้ 因为 ได้เหมาะสม",
      answer: "因为我累，所以想休息。",
      choices: ["因为我累，所以想休息。", "因为你好。", "因为三本书。", "因为在桌子。"],
    },
  },
  {
    id: "hsk3",
    title: "HSK 3",
    words: 600,
    target: "เล่าเหตุการณ์และรับมือสถานการณ์ทั่วไป",
    color: "#22806b",
    focus: "คำเชื่อม ลำดับเหตุการณ์ ประสบการณ์ และคำขยาย",
    vocabulary: [
      { hanzi: "突然", pinyin: "tu ran", thai: "ทันใดนั้น", example: "他突然给我打电话。" },
      { hanzi: "认真", pinyin: "ren zhen", thai: "ตั้งใจ", example: "她学习很认真。" },
      { hanzi: "机会", pinyin: "ji hui", thai: "โอกาส", example: "这是一个好机会。" },
      { hanzi: "完成", pinyin: "wan cheng", thai: "ทำเสร็จ", example: "我已经完成作业了。" },
    ],
    lesson: {
      title: "เล่าประสบการณ์ด้วย 过 และ 了",
      grammar: "ใช้ 过 เพื่อบอกว่าเคยทำ ใช้ 了 เพื่อบอกการเปลี่ยนแปลงหรือจบเหตุการณ์",
      dialog: "A: 你去过北京吗? B: 去过，我去年去了北京。",
    },
    quiz: {
      prompt: "我已经完成作业了 สื่อความหมายใกล้เคียงข้อใด",
      answer: "ฉันทำการบ้านเสร็จแล้ว",
      choices: ["ฉันทำการบ้านเสร็จแล้ว", "ฉันยังไม่เริ่ม", "ฉันจะซื้อการบ้าน", "ฉันไม่รู้จักการบ้าน"],
    },
  },
  {
    id: "hsk4",
    title: "HSK 4",
    words: 1200,
    target: "อภิปรายเรื่องเรียน งาน และสังคมได้ชัดขึ้น",
    color: "#2f6db5",
    focus: "คำศัพท์นามธรรม โครงสร้างซับซ้อน และการแสดงมุมมอง",
    vocabulary: [
      { hanzi: "适应", pinyin: "shi ying", thai: "ปรับตัว", example: "我需要时间适应新环境。" },
      { hanzi: "压力", pinyin: "ya li", thai: "ความกดดัน", example: "考试前压力很大。" },
      { hanzi: "经验", pinyin: "jing yan", thai: "ประสบการณ์", example: "这份工作需要经验。" },
      { hanzi: "提高", pinyin: "ti gao", thai: "ยกระดับ", example: "阅读可以提高词汇量。" },
    ],
    lesson: {
      title: "แสดงความคิดเห็นอย่างเป็นเหตุผล",
      grammar: "ใช้ 对...来说 เพื่อบอกมุมมองของคนหรือกลุ่มหนึ่ง",
      dialog: "A: 对你来说，学中文最难的是什么? B: 我觉得是听力。",
    },
    quiz: {
      prompt: "คำว่า 提高 ใช้กับอะไรได้เหมาะที่สุด",
      answer: "提高听力水平",
      choices: ["提高听力水平", "提高一杯水", "提高桌子下面", "提高昨天"],
    },
  },
];

const dailyTasks = ["อ่านออกเสียง 10 นาที", "ทบทวนบัตรคำ 12 ใบ", "ทำแบบทดสอบ 5 ข้อ", "เขียนประโยคใหม่ 3 ประโยค"];

export default function Home() {
  const [activeLevel, setActiveLevel] = useState(levels[0]);
  const [flipped, setFlipped] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
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

  function chooseLevel(level: Level) {
    setActiveLevel(level);
    setCardIndex(0);
    setFlipped(false);
    setSelectedAnswer("");
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
    <main className="min-h-screen bg-[var(--page)] text-[var(--ink)]">
      <section className="hero">
        <nav className="topbar" aria-label="เมนูหลัก">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">汉</span>
            <span>HSK Studio</span>
          </div>
          <a className="ghost-link" href="#practice">เริ่มฝึก</a>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">เว็บเรียนจีนสำหรับผู้เรียนไทย</p>
            <h1>เรียน HSK ให้จำได้ ใช้เป็น และเห็นความคืบหน้าทุกวัน</h1>
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
          <p className="eyebrow">Quiz</p>
          <h2>{activeLevel.quiz.prompt}</h2>
          <div className="choice-grid">
            {activeLevel.quiz.choices.map((choice) => (
              <button
                className={`choice ${selectedAnswer === choice ? "selected" : ""}`}
                key={choice}
                onClick={() => setSelectedAnswer(choice)}
                type="button"
              >
                {choice}
              </button>
            ))}
          </div>
          {selectedAnswer && (
            <p className={selectedAnswer === activeLevel.quiz.answer ? "feedback good" : "feedback"}>
              {selectedAnswer === activeLevel.quiz.answer ? "ถูกต้อง เก็บแต้มวันนี้ได้เลย" : `ยังไม่ใช่ คำตอบคือ ${activeLevel.quiz.answer}`}
            </p>
          )}
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
