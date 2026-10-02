// Shared description of the paper-based HSK exam layout. The quiz page renders sections
// from it and the admin exam builder uses it to create rows that render the same way.

export type ExamPart = "listening" | "reading" | "writing";

// How a section is laid out on the paper:
// - tf-image:    one picture per question, mark ✓ / ✗
// - image-choice: three pictures A-C per question
// - image-bank:  six pictures A-F printed once, every question picks a letter
// - text-choice: text options A-C per question
// - text-bank:   six sentences/words A-F printed once, every question picks a letter
export type SectionLayout = "tf-image" | "image-choice" | "image-bank" | "text-choice" | "text-bank";

export type SectionSpec = {
  part: ExamPart;
  section: string;
  layout: SectionLayout;
  format: "true-false" | "image-choice" | "choice" | "matching" | "fill-blank";
  firstNumber: number;
  questionCount: number;
  choiceCount: number;
  instructionZh: string;
  instructionTh: string;
};

export type LevelSpec = {
  titleZh: string;
  minutes: number;
  passScore: number;
  parts: Array<{ part: ExamPart; questions: number; minutes: string }>;
  sections: SectionSpec[];
};

export const TRUE_CHOICE = "ถูก";
export const FALSE_CHOICE = "ผิด";

export const partNames: Record<ExamPart, { zh: string; th: string; numeral: string }> = {
  listening: { zh: "听力", th: "การฟัง", numeral: "一" },
  reading: { zh: "阅读", th: "การอ่าน", numeral: "二" },
  writing: { zh: "书写", th: "การเขียน", numeral: "三" },
};

const sectionNumerals = ["一", "二", "三", "四", "五", "六"];

export function sectionTitleZh(section: string) {
  const index = Number(section) - 1;
  return sectionNumerals[index] ? `第${sectionNumerals[index]}部分` : `第 ${section} 部分`;
}

export const levelSpecs: Record<string, LevelSpec> = {
  hsk1: {
    titleZh: "HSK（一级）",
    minutes: 35,
    passScore: 120,
    parts: [
      { part: "listening", questions: 20, minutes: "约15分钟" },
      { part: "reading", questions: 20, minutes: "17分钟" },
    ],
    sections: [
      { part: "listening", section: "1", layout: "tf-image", format: "true-false", firstNumber: 1, questionCount: 5, choiceCount: 2, instructionZh: "听录音，判断图片与听到的内容是否一致。", instructionTh: "ฟังเสียง แล้วตัดสินว่ารูปภาพตรงกับสิ่งที่ได้ยินหรือไม่" },
      { part: "listening", section: "2", layout: "image-choice", format: "image-choice", firstNumber: 6, questionCount: 5, choiceCount: 3, instructionZh: "听录音，选出与听到的内容对应的图片。", instructionTh: "ฟังเสียง แล้วเลือกรูปภาพที่ตรงกับสิ่งที่ได้ยิน" },
      { part: "listening", section: "3", layout: "image-bank", format: "image-choice", firstNumber: 11, questionCount: 5, choiceCount: 6, instructionZh: "听对话，从 A–F 中选出与对话内容对应的图片。", instructionTh: "ฟังบทสนทนา แล้วเลือกรูปภาพ A–F ที่ตรงกับบทสนทนา" },
      { part: "listening", section: "4", layout: "text-choice", format: "choice", firstNumber: 16, questionCount: 5, choiceCount: 3, instructionZh: "听句子和问题，选出正确答案。", instructionTh: "ฟังประโยคและคำถาม แล้วเลือกคำตอบที่ถูกต้อง" },
      { part: "reading", section: "1", layout: "tf-image", format: "true-false", firstNumber: 21, questionCount: 5, choiceCount: 2, instructionZh: "看图片和词语，判断是否一致。", instructionTh: "ดูรูปภาพกับคำศัพท์ แล้วตัดสินว่าตรงกันหรือไม่" },
      { part: "reading", section: "2", layout: "image-bank", format: "image-choice", firstNumber: 26, questionCount: 5, choiceCount: 6, instructionZh: "从 A–F 中选出与句子内容对应的图片。", instructionTh: "เลือกรูปภาพ A–F ที่ตรงกับประโยค" },
      { part: "reading", section: "3", layout: "text-bank", format: "matching", firstNumber: 31, questionCount: 5, choiceCount: 6, instructionZh: "从 A–F 中选出合适的回答。", instructionTh: "เลือกประโยคตอบกลับ A–F ที่เหมาะสม" },
      { part: "reading", section: "4", layout: "text-bank", format: "fill-blank", firstNumber: 36, questionCount: 5, choiceCount: 6, instructionZh: "从 A–F 中选出合适的词语填空。", instructionTh: "เลือกคำศัพท์ A–F เติมลงในช่องว่าง" },
    ],
  },
  hsk2: { titleZh: "HSK（二级）", minutes: 50, passScore: 120, parts: [{ part: "listening", questions: 35, minutes: "约25分钟" }, { part: "reading", questions: 25, minutes: "22分钟" }], sections: [] },
  hsk3: { titleZh: "HSK（三级）", minutes: 85, passScore: 180, parts: [{ part: "listening", questions: 40, minutes: "约35分钟" }, { part: "reading", questions: 30, minutes: "30分钟" }, { part: "writing", questions: 10, minutes: "15分钟" }], sections: [] },
  hsk4: { titleZh: "HSK（四级）", minutes: 100, passScore: 180, parts: [{ part: "listening", questions: 45, minutes: "约30分钟" }, { part: "reading", questions: 40, minutes: "40分钟" }, { part: "writing", questions: 15, minutes: "25分钟" }], sections: [] },
  hsk5: { titleZh: "HSK（五级）", minutes: 120, passScore: 180, parts: [{ part: "listening", questions: 45, minutes: "约30分钟" }, { part: "reading", questions: 45, minutes: "45分钟" }, { part: "writing", questions: 10, minutes: "40分钟" }], sections: [] },
  hsk6: { titleZh: "HSK（六级）", minutes: 135, passScore: 180, parts: [{ part: "listening", questions: 50, minutes: "约35分钟" }, { part: "reading", questions: 50, minutes: "50分钟" }, { part: "writing", questions: 1, minutes: "45分钟" }], sections: [] },
};

export function getLevelSpec(levelId: string): LevelSpec | undefined {
  return levelSpecs[levelId];
}

export function getSectionSpec(levelId: string, part: string, section: string): SectionSpec | undefined {
  return levelSpecs[levelId]?.sections.find((spec) => spec.part === part && spec.section === section);
}

export function choiceLetter(index: number) {
  return String.fromCharCode(65 + index);
}

// Image choices are stored as a JSON array in image_url; a plain string is a single illustration.
export function parseImageList(imageUrl?: string): string[] {
  if (!imageUrl?.trim().startsWith("[")) return [];
  try {
    const parsed = JSON.parse(imageUrl) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function singleImage(imageUrl?: string) {
  return imageUrl && !imageUrl.trim().startsWith("[") ? imageUrl : "";
}

export function isTrueFalseQuestion(question: { format?: string; choices: string[] }) {
  return question.format === "true-false" && question.choices.every((choice) => choice === TRUE_CHOICE || choice === FALSE_CHOICE);
}
