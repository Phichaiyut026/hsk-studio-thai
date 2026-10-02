"use client";

import {
  FALSE_CHOICE,
  TRUE_CHOICE,
  choiceLetter,
  getSectionSpec,
  isTrueFalseQuestion,
  parseImageList,
  partNames,
  sectionTitleZh,
  singleImage,
  type ExamPart,
} from "../../../lib/hsk-exam-format";

export type ExamQuestion = {
  id: string;
  prompt: string;
  answer: string;
  choices: string[];
  format?: string;
  questionNumber?: number;
  isExample?: boolean;
  mediaUrl?: string;
  imageUrl?: string;
};

type Answers = Record<string, string>;

type SectionProps = {
  levelId: string;
  part: string;
  section: string;
  questions: ExamQuestion[];
  answers?: Answers;
  onAnswer?: (questionId: string, choice: string) => void;
  // Review mode: shows the correct answer, the candidate's mistakes and listening transcripts.
  reveal?: boolean;
};

function markState(question: ExamQuestion, choice: string, answers: Answers, reveal: boolean) {
  const selected = question.isExample ? question.answer === choice : answers[question.id] === choice;
  if (!reveal || question.isExample) return selected ? "is-selected" : "";
  if (question.answer === choice) return selected ? "is-selected is-correct" : "is-correct";
  return selected ? "is-selected is-wrong" : "";
}

function sharedBankSource(questions: ExamQuestion[], bankLayout: boolean) {
  if (!bankLayout || questions.length === 0) return null;
  const source = questions.find((question) => question.choices.length > 0) ?? null;
  if (!source) return null;
  const signature = source.choices.join("\u0000");
  return questions.every((question) => question.choices.length === 0 || question.choices.join("\u0000") === signature) ? source : null;
}

export function ExamSectionPaper({ levelId, part, section, questions, answers = {}, onAnswer, reveal = false }: SectionProps) {
  const spec = getSectionSpec(levelId, part, section);
  const partName = partNames[part as ExamPart];
  const examples = questions.filter((question) => question.isExample);
  const scored = questions.filter((question) => !question.isExample);
  const numbers = scored.map((question) => question.questionNumber ?? 0).filter(Boolean);
  const range = numbers.length ? (Math.min(...numbers) === Math.max(...numbers) ? `第 ${numbers[0]} 题` : `第 ${Math.min(...numbers)}–${Math.max(...numbers)} 题`) : "";
  const audioUrl = part === "listening" ? questions.find((question) => question.mediaUrl)?.mediaUrl ?? "" : "";
  const bankSource = sharedBankSource(questions, spec?.layout === "image-bank" || spec?.layout === "text-bank");
  const bankImages = bankSource ? parseImageList(bankSource.imageUrl) : [];
  // Listening prompts are the audio transcript; keep them hidden during the exam when there is audio.
  const hidePrompt = part === "listening" && Boolean(audioUrl) && !reveal;
  const readOnly = !onAnswer || reveal;

  function renderQuestion(question: ExamQuestion) {
    const number = question.isExample ? "例如" : `${question.questionNumber ?? ""}.`;
    const images = parseImageList(question.imageUrl);
    const picture = singleImage(question.imageUrl);
    const prompt = !hidePrompt && question.prompt ? question.prompt : "";
    const interactive = !readOnly && !question.isExample;
    const choose = (choice: string) => interactive && onAnswer?.(question.id, choice);

    if (isTrueFalseQuestion(question)) {
      return (
        <div className={`exam-q exam-q-tf ${question.isExample ? "is-example" : ""}`} key={question.id}>
          <span className="exam-q-number">{number}</span>
          <div className="exam-q-body">
            {picture && <img src={picture} alt="" className="exam-picture" />}
            {prompt && <p className="exam-q-prompt">{prompt}</p>}
          </div>
          <div className="exam-marks" role="group" aria-label={`ข้อ ${question.questionNumber ?? ""}`}>
            {[TRUE_CHOICE, FALSE_CHOICE].map((choice) => (
              <button key={choice} type="button" disabled={!interactive} onClick={() => choose(choice)} className={`exam-mark ${markState(question, choice, answers, reveal)}`} aria-label={choice} aria-pressed={markState(question, choice, answers, reveal).includes("is-selected")}>
                {choice === TRUE_CHOICE ? "✓" : "✗"}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (bankSource) {
      return (
        <div className={`exam-q exam-q-bank ${question.isExample ? "is-example" : ""}`} key={question.id}>
          <span className="exam-q-number">{number}</span>
          <div className="exam-q-body">
            {picture && <img src={picture} alt="" className="exam-picture" />}
            {prompt ? <p className="exam-q-prompt">{prompt}</p> : <p className="exam-q-prompt is-muted">{part === "listening" ? "（听录音）" : ""}</p>}
          </div>
          <div className="exam-marks">
            {question.choices.map((choice, index) => (
              <button key={`${choice}-${index}`} type="button" disabled={!interactive} onClick={() => choose(choice)} className={`exam-mark ${markState(question, choice, answers, reveal)}`} aria-label={`ตัวเลือก ${choiceLetter(index)}`}>
                {choiceLetter(index)}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (images.length > 0) {
      return (
        <div className={`exam-q exam-q-images ${question.isExample ? "is-example" : ""}`} key={question.id}>
          <span className="exam-q-number">{number}</span>
          <div className="exam-q-body">
            {prompt && <p className="exam-q-prompt">{prompt}</p>}
            <div className="exam-image-options">
              {question.choices.map((choice, index) => (
                <button key={`${choice}-${index}`} type="button" disabled={!interactive} onClick={() => choose(choice)} className={`exam-image-option ${markState(question, choice, answers, reveal)}`} aria-label={`ตัวเลือก ${choiceLetter(index)}`}>
                  {images[index] ? <img src={images[index]} alt="" /> : <span className="exam-image-missing">{choice}</span>}
                  <span className="exam-option-letter">{choiceLetter(index)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (question.choices.length > 0) {
      return (
        <div className={`exam-q exam-q-text ${question.isExample ? "is-example" : ""}`} key={question.id}>
          <span className="exam-q-number">{number}</span>
          <div className="exam-q-body">
            {picture && <img src={picture} alt="" className="exam-picture" />}
            {prompt && <p className="exam-q-prompt">{prompt}</p>}
            <div className="exam-text-options">
              {question.choices.map((choice, index) => (
                <button key={`${choice}-${index}`} type="button" disabled={!interactive} onClick={() => choose(choice)} className={`exam-text-option ${markState(question, choice, answers, reveal)}`}>
                  <span className="exam-option-letter">{choiceLetter(index)}</span>
                  <span>{choice}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    const typed = question.isExample ? question.answer : answers[question.id] ?? "";
    return (
      <div className={`exam-q exam-q-input ${question.isExample ? "is-example" : ""}`} key={question.id}>
        <span className="exam-q-number">{number}</span>
        <div className="exam-q-body">
          {picture && <img src={picture} alt="" className="exam-picture" />}
          {prompt && <p className="exam-q-prompt">{prompt}</p>}
          <input className="exam-write-input" value={typed} readOnly={!interactive} onChange={(event) => onAnswer?.(question.id, event.target.value)} placeholder="เขียนคำตอบ" aria-label={`คำตอบข้อ ${question.questionNumber ?? ""}`} />
          {reveal && !question.isExample && <p className="exam-q-key">เฉลย：{question.answer}</p>}
        </div>
      </div>
    );
  }

  return (
    <section className="exam-paper">
      <header className="exam-paper-head">
        <h2>{partName ? `${partName.numeral}、${partName.zh}` : part}</h2>
        <div className="exam-section-title">
          <strong>{sectionTitleZh(section)}</strong>
          {range && <span>{range}</span>}
        </div>
        <p className="exam-instruction">
          {spec?.instructionZh ?? "请选出正确答案。"}
          <small>{spec?.instructionTh ?? "เลือกคำตอบที่ถูกต้อง"}{partName ? ` · ${partName.th} ส่วนที่ ${section}` : ""}</small>
        </p>
      </header>

      {audioUrl && <audio controls preload="metadata" src={audioUrl} className="exam-audio">เบราว์เซอร์นี้ไม่รองรับการเล่นเสียง</audio>}

      {bankSource && (
        <div className={`exam-bank ${bankImages.length ? "is-images" : "is-text"}`}>
          {bankSource.choices.map((choice, index) => (
            <div className="exam-bank-item" key={`${choice}-${index}`}>
              <span className="exam-option-letter">{choiceLetter(index)}</span>
              {bankImages[index] ? <img src={bankImages[index]} alt="" /> : <span>{choice}</span>}
            </div>
          ))}
        </div>
      )}

      {examples.length > 0 && <div className="exam-examples">{examples.map(renderQuestion)}</div>}
      <div className="exam-questions">{scored.map(renderQuestion)}</div>
      {scored.length === 0 && <p className="exam-empty">ยังไม่มีข้อสอบในส่วนนี้</p>}
    </section>
  );
}

export type AnswerSheetSection = {
  key: string;
  part: string;
  section: string;
  questions: ExamQuestion[];
};

// Mirrors the HSK 答题卡: one row per question with a bubble for every option.
export function AnswerSheet({ sections, answers, currentKey, onJump, reveal = false }: { sections: AnswerSheetSection[]; answers: Answers; currentKey?: string; onJump?: (key: string) => void; reveal?: boolean }) {
  return (
    <div className="exam-answer-sheet">
      {sections.map((sheetSection) => {
        const partName = partNames[sheetSection.part as ExamPart];
        const scored = sheetSection.questions.filter((question) => !question.isExample);
        if (!scored.length) return null;
        return (
          <button type="button" key={sheetSection.key} onClick={() => onJump?.(sheetSection.key)} className={`exam-sheet-block ${currentKey === sheetSection.key ? "is-current" : ""}`}>
            <span className="exam-sheet-label">{partName?.zh ?? sheetSection.part} {sectionTitleZh(sheetSection.section)}</span>
            {scored.map((question) => {
              const tf = isTrueFalseQuestion(question);
              const options = tf ? [TRUE_CHOICE, FALSE_CHOICE] : question.choices;
              return (
                <span className="exam-sheet-row" key={question.id}>
                  <b>{question.questionNumber}</b>
                  {options.length ? options.map((choice, index) => {
                    const selected = answers[question.id] === choice;
                    const state = reveal ? (choice === question.answer ? "is-correct" : selected ? "is-wrong" : "") : "";
                    return <i key={`${choice}-${index}`} className={`${selected ? "is-filled" : ""} ${state}`}>{tf ? (choice === TRUE_CHOICE ? "✓" : "✗") : choiceLetter(index)}</i>;
                  }) : <i className={answers[question.id] ? "is-filled is-wide" : "is-wide"}>{answers[question.id] ? "✎" : ""}</i>}
                </span>
              );
            })}
          </button>
        );
      })}
    </div>
  );
}
