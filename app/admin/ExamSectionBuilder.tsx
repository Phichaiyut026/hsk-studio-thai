"use client";

import { useEffect, useMemo, useState } from "react";
import { ExamSectionPaper, type ExamQuestion } from "../components/exam/ExamPaper";
import {
  FALSE_CHOICE,
  TRUE_CHOICE,
  choiceLetter,
  partNames,
  sectionTitleZh,
  type SectionSpec,
} from "../../lib/hsk-exam-format";

type BuilderRow = {
  prompt: string;
  answer: string;
  imageFiles: Array<File | null>;
  choices: string[];
};

const imageAccept = "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";
const audioAccept = "audio/mpeg,audio/wav,audio/ogg,audio/mp4,.mp3,.wav,.ogg,.m4a";

function letters(count: number) {
  return Array.from({ length: count }, (_, index) => choiceLetter(index));
}

function createRows(spec: SectionSpec): BuilderRow[] {
  return Array.from({ length: spec.questionCount + 1 }, () => ({
    prompt: "",
    answer: "",
    imageFiles: Array.from({ length: spec.layout === "tf-image" ? 1 : spec.layout === "image-choice" ? spec.choiceCount : 0 }, () => null),
    choices: spec.layout === "text-choice" ? Array.from({ length: spec.choiceCount }, () => "") : [],
  }));
}

// Object URLs let the preview show picked files before they are uploaded.
function useObjectUrls(files: Array<File | null>) {
  const urls = useMemo(() => files.map((file) => (file ? URL.createObjectURL(file) : "")), [files]);
  useEffect(() => () => urls.forEach((url) => url && URL.revokeObjectURL(url)), [urls]);
  return urls;
}

async function uploadMedia(file: File) {
  const data = new FormData();
  data.append("file", file);
  const response = await fetch("/api/admin/media", { method: "POST", body: data });
  const result = (await response.json().catch(() => ({}))) as { mediaUrl?: string; error?: string };
  if (!response.ok || !result.mediaUrl) throw new Error(result.error ?? "อัปโหลดไฟล์ไม่สำเร็จ");
  return result.mediaUrl;
}

export default function ExamSectionBuilder({
  levelId,
  documentId,
  spec,
  existingCount,
  setMessage,
  onSaved,
}: {
  levelId: string;
  documentId: string;
  spec: SectionSpec;
  existingCount: number;
  setMessage: (message: string) => void;
  onSaved: () => Promise<void>;
}) {
  const [rows, setRows] = useState<BuilderRow[]>(() => createRows(spec));
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [bankImages, setBankImages] = useState<Array<File | null>>(() => Array.from({ length: spec.choiceCount }, () => null));
  const [bankTexts, setBankTexts] = useState<string[]>(() => Array.from({ length: spec.choiceCount }, () => ""));
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const isBank = spec.layout === "image-bank" || spec.layout === "text-bank";
  const isListening = spec.part === "listening";
  const audioUrl = useObjectUrls(useMemo(() => [audioFile], [audioFile]))[0];
  const bankImageUrls = useObjectUrls(bankImages);
  const rowImageFiles = useMemo(() => rows.flatMap((row) => row.imageFiles), [rows]);
  const rowImageUrls = useObjectUrls(rowImageFiles);

  function questionNumber(index: number) {
    return index === 0 ? 0 : spec.firstNumber + index - 1;
  }

  function rowLabel(index: number) {
    return index === 0 ? "例如 ตัวอย่าง" : `ข้อ ${questionNumber(index)}`;
  }

  function rowChoices(row: BuilderRow) {
    if (spec.layout === "tf-image") return [];
    if (spec.layout === "text-choice") return row.choices;
    if (spec.layout === "text-bank") return bankTexts;
    return letters(spec.choiceCount);
  }

  function answerOptions(row: BuilderRow) {
    if (spec.layout === "tf-image") return [{ value: TRUE_CHOICE, label: "✓ ถูก" }, { value: FALSE_CHOICE, label: "✗ ผิด" }];
    return rowChoices(row).map((choice, index) => ({ value: choice, label: spec.layout === "text-choice" || spec.layout === "text-bank" ? `${choiceLetter(index)}  ${choice || "(ยังไม่กรอก)"}` : choiceLetter(index) })).filter((option) => option.value);
  }

  function updateRow(index: number, patch: Partial<BuilderRow>) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function rowImageUrlsFor(index: number) {
    const offset = rows.slice(0, index).reduce((total, row) => total + row.imageFiles.length, 0);
    return rowImageUrls.slice(offset, offset + rows[index].imageFiles.length);
  }

  const previewQuestions: ExamQuestion[] = rows.map((row, index) => {
    const images = spec.layout === "image-bank" ? bankImageUrls : rowImageUrlsFor(index);
    return {
      id: `draft-${index}`,
      isExample: index === 0,
      questionNumber: questionNumber(index),
      prompt: row.prompt,
      answer: row.answer,
      choices: rowChoices(row),
      format: spec.format,
      mediaUrl: audioUrl,
      imageUrl: spec.layout === "tf-image" ? images[0] ?? "" : images.some(Boolean) ? JSON.stringify(images) : "",
    };
  });

  function validate() {
    if (!documentId.trim()) return "กรุณากรอกชื่อชุดข้อสอบก่อน";
    if (isListening && !audioFile) return "กรุณาแนบไฟล์เสียงของส่วนนี้";
    if (spec.layout === "image-bank" && bankImages.some((file) => !file)) return `กรุณาแนบภาพ A–${choiceLetter(spec.choiceCount - 1)} ให้ครบ`;
    if (spec.layout === "text-bank" && bankTexts.some((text) => !text.trim())) return `กรุณากรอกตัวเลือก A–${choiceLetter(spec.choiceCount - 1)} ให้ครบ`;
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      if (row.imageFiles.some((file) => !file)) return `กรุณาแนบภาพของ${rowLabel(index)}`;
      if (spec.layout === "text-choice" && row.choices.some((choice) => !choice.trim())) return `กรุณากรอกตัวเลือกของ${rowLabel(index)}`;
      if (!isListening && !row.prompt.trim() && spec.layout !== "image-choice") return `กรุณากรอกโจทย์ของ${rowLabel(index)}`;
      if (!row.answer) return `กรุณาเลือกคำตอบของ${rowLabel(index)}`;
    }
    return "";
  }

  async function save() {
    const problem = validate();
    if (problem) {
      setMessage(problem);
      return;
    }
    setSaving(true);
    setMessage(`กำลังบันทึก ${rows.length} รายการ...`);
    try {
      const mediaUrl = audioFile ? await uploadMedia(audioFile) : "";
      const sharedImages = spec.layout === "image-bank" ? await Promise.all(bankImages.map((file) => uploadMedia(file as File))) : [];
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const images = spec.layout === "image-bank" ? sharedImages : await Promise.all(row.imageFiles.map((file) => uploadMedia(file as File)));
        const response = await fetch("/api/admin/exams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            levelId,
            documentId: documentId.trim(),
            part: spec.part,
            section: spec.section,
            format: spec.format,
            questionNumber: questionNumber(index),
            isExample: index === 0,
            prompt: row.prompt.trim(),
            choices: rowChoices(row),
            answer: row.answer,
            mediaUrl,
            imageUrl: spec.layout === "tf-image" ? images[0] ?? "" : images.length ? JSON.stringify(images) : "",
          }),
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? `บันทึก${rowLabel(index)}ไม่สำเร็จ`);
        }
      }
      setRows(createRows(spec));
      setAudioFile(null);
      setBankImages(Array.from({ length: spec.choiceCount }, () => null));
      setBankTexts(Array.from({ length: spec.choiceCount }, () => ""));
      setFormKey((key) => key + 1);
      await onSaved();
      setMessage(`บันทึก ${partNames[spec.part].zh} ${sectionTitleZh(spec.section)} ของชุด ${documentId} ครบ ${rows.length} รายการแล้ว`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-section-builder" key={formKey}>
      <div className="admin-section-builder-form">
        <div className="admin-form-heading">
          <div>
            <span className="admin-card-kicker">{partNames[spec.part].zh} · {sectionTitleZh(spec.section)} · 第 {spec.firstNumber}–{spec.firstNumber + spec.questionCount - 1} 题</span>
            <h3>{spec.instructionTh}</h3>
          </div>
          <span className="admin-required-note">ตัวอย่าง 1 + ข้อสอบ {spec.questionCount} ข้อ</span>
        </div>
        {existingCount > 0 && <p className="admin-section-warning">ส่วนนี้ในชุด {documentId} มีอยู่แล้ว {existingCount} รายการ ถ้าบันทึกอีกจะได้ข้อซ้ำ ให้ลบหรือแก้ไขจากตารางด้านล่างแทน</p>}

        {isListening && <label className="admin-builder-field">ไฟล์เสียงของส่วนนี้ *<input type="file" accept={audioAccept} onChange={(event) => setAudioFile(event.target.files?.[0] ?? null)} /></label>}

        {isBank && (
          <fieldset className="admin-builder-bank">
            <legend>{spec.layout === "image-bank" ? "ภาพตัวเลือกที่ใช้ร่วมกันทั้งส่วน" : "ตัวเลือกที่ใช้ร่วมกันทั้งส่วน"} (A–{choiceLetter(spec.choiceCount - 1)})</legend>
            {letters(spec.choiceCount).map((letter, index) => (
              <label key={letter}>
                {letter}
                {spec.layout === "image-bank" ? (
                  <input type="file" accept={imageAccept} onChange={(event) => setBankImages((current) => current.map((file, fileIndex) => (fileIndex === index ? event.target.files?.[0] ?? null : file)))} />
                ) : (
                  <input value={bankTexts[index]} onChange={(event) => setBankTexts((current) => current.map((text, textIndex) => (textIndex === index ? event.target.value : text)))} placeholder={spec.format === "fill-blank" ? "คำศัพท์ เช่น 名字" : "ประโยคตอบกลับ"} />
                )}
              </label>
            ))}
          </fieldset>
        )}

        <div className="admin-builder-rows">
          {rows.map((row, index) => (
            <div className={`admin-builder-row ${index === 0 ? "is-example" : ""}`} key={index}>
              <strong>{rowLabel(index)}</strong>
              {row.imageFiles.map((_, imageIndex) => (
                <label key={imageIndex}>
                  {row.imageFiles.length > 1 ? `ภาพ ${choiceLetter(imageIndex)}` : "ภาพประกอบ"} *
                  <input type="file" accept={imageAccept} onChange={(event) => updateRow(index, { imageFiles: row.imageFiles.map((file, fileIndex) => (fileIndex === imageIndex ? event.target.files?.[0] ?? null : file)) })} />
                </label>
              ))}
              {spec.layout === "text-choice" && row.choices.map((choice, choiceIndex) => (
                <label key={choiceIndex}>
                  ตัวเลือก {choiceLetter(choiceIndex)} *
                  <input value={choice} onChange={(event) => updateRow(index, { choices: row.choices.map((value, valueIndex) => (valueIndex === choiceIndex ? event.target.value : value)), answer: row.answer === choice ? "" : row.answer })} />
                </label>
              ))}
              <label className="is-wide">
                {isListening ? "บทพูดในเสียง (แสดงตอนเฉลย)" : spec.format === "fill-blank" ? "ประโยคที่มีช่องว่าง（ ）*" : spec.layout === "tf-image" ? "คำ/ข้อความใต้ภาพ *" : "โจทย์ *"}
                <textarea rows={2} value={row.prompt} onChange={(event) => updateRow(index, { prompt: event.target.value })} placeholder={isListening ? "เช่น 我很好。" : spec.format === "fill-blank" ? "เช่น 你叫什么（  ）？" : ""} />
              </label>
              <label>
                คำตอบ *
                <select value={row.answer} onChange={(event) => updateRow(index, { answer: event.target.value })}>
                  <option value="">เลือก</option>
                  {answerOptions(row).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>
          ))}
        </div>

        <div className="admin-form-actions">
          <span>ตัวอย่าง (例如) แสดงให้ผู้สอบดูแต่ไม่คิดคะแนน</span>
          <button className="admin-primary-button" type="button" disabled={saving} onClick={() => void save()}>{saving ? "กำลังบันทึก..." : `บันทึก ${rows.length} รายการ`}</button>
        </div>
      </div>

      <div className="admin-exam-preview">
        <span className="admin-card-kicker">ตัวอย่างหน้าข้อสอบที่ผู้เรียนจะเห็น (แสดงเฉลยสีเขียว)</span>
        <ExamSectionPaper levelId={levelId} part={spec.part} section={spec.section} questions={previewQuestions} reveal />
      </div>
    </div>
  );
}
