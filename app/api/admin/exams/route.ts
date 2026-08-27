import { getChatGPTUser } from "../../../chatgpt-auth";
import { addQuizQuestion, deleteQuizQuestion, ensureUserProfile, listQuizQuestions, updateQuizQuestion } from "../../../../lib/hsk-db";

async function getAdmin() {
  const user = await getChatGPTUser();
  if (!user) return null;
  const profile = await ensureUserProfile({ userId: user.userId, email: user.email, displayName: user.displayName });
  return profile.role === "admin" ? profile : null;
}

const formatsWithChoices = new Set(["choice", "image-choice", "matching"]);
const trueFalseChoices = ["ถูก", "ผิด"];

function normalizeQuestionPayload(payload: {
  levelId?: string; documentId?: string; part?: string; section?: string; format?: string;
  questionNumber?: number; isExample?: boolean; prompt?: string; choices?: string[]; answer?: string; mediaUrl?: string; imageUrl?: string;
}) {
  const format = payload.format?.trim() ?? "";
  const choices = format === "true-false"
    ? trueFalseChoices
    : Array.isArray(payload.choices)
      ? payload.choices.map((choice) => choice.trim()).filter(Boolean)
      : [];

  return {
    levelId: payload.levelId?.trim() ?? "",
    documentId: payload.documentId?.trim() ?? "",
    part: payload.part?.trim() ?? "",
    section: payload.section?.trim() ?? "",
    format,
    questionNumber: Number(payload.questionNumber ?? 0),
    isExample: Boolean(payload.isExample),
    prompt: payload.prompt?.trim() ?? "",
    choices,
    answer: payload.answer?.trim() ?? "",
    mediaUrl: payload.mediaUrl?.trim() ?? "",
    imageUrl: payload.imageUrl?.trim() ?? "",
  };
}

function validateQuestion(values: ReturnType<typeof normalizeQuestionPayload>) {
  if (!values.levelId || !values.documentId || !values.part || !values.section || !values.format || (!values.questionNumber && !values.isExample) || !values.answer) {
    return "กรุณากรอกระดับ ชุดข้อสอบ พาร์ท ส่วน เลขข้อ และคำตอบให้ครบ";
  }
  if (values.format !== "true-false" && !values.prompt && !values.mediaUrl && !values.imageUrl) {
    return "กรุณากรอกโจทย์ หรือแนบสื่ออย่างน้อย 1 อย่าง";
  }
  if (formatsWithChoices.has(values.format) && values.choices.length < 2) {
    return "กรุณาเพิ่มตัวเลือกอย่างน้อย 2 ตัวเลือก";
  }
  if (values.format === "true-false" && !trueFalseChoices.includes(values.answer)) {
    return "คำตอบถูก/ผิดต้องเป็น ถูก หรือ ผิด";
  }
  if (formatsWithChoices.has(values.format) && !values.choices.includes(values.answer)) {
    return "คำตอบต้องตรงกับตัวเลือกที่เพิ่มไว้";
  }
  return "";
}

export async function GET() {
  try {
    if (!(await getAdmin())) return Response.json({ error: "Admin access required" }, { status: 403 });
    return Response.json({ questions: await listQuizQuestions() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await getAdmin())) return Response.json({ error: "Admin access required" }, { status: 403 });
    const payload = (await request.json()) as {
      levelId?: string; documentId?: string; part?: string; section?: string; format?: string;
      questionNumber?: number; isExample?: boolean; prompt?: string; choices?: string[]; answer?: string; mediaUrl?: string; imageUrl?: string;
    };
    const values = normalizeQuestionPayload(payload);
    const error = validateQuestion(values);
    if (error) return Response.json({ error }, { status: 400 });
    return Response.json({ ok: true, question: await addQuizQuestion(values) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 400 });
  }
}

async function parseQuestionPayload(request: Request) {
  const payload = (await request.json()) as {
    levelId?: string; documentId?: string; part?: string; section?: string; format?: string;
    questionNumber?: number; isExample?: boolean; prompt?: string; choices?: string[]; answer?: string; mediaUrl?: string; imageUrl?: string;
  };
  return normalizeQuestionPayload(payload);
}

export async function PATCH(request: Request) {
  try {
    if (!(await getAdmin())) return Response.json({ error: "Admin access required" }, { status: 403 });
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "Missing question id" }, { status: 400 });
    const values = await parseQuestionPayload(request);
    const error = validateQuestion(values);
    if (error) return Response.json({ error }, { status: 400 });
    return Response.json({ ok: true, question: await updateQuizQuestion(id, values) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "แก้ไขข้อสอบไม่สำเร็จ" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await getAdmin())) return Response.json({ error: "Admin access required" }, { status: 403 });
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "Missing question id" }, { status: 400 });
    return Response.json({ ok: true, question: await deleteQuizQuestion(id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "ลบข้อสอบไม่สำเร็จ" }, { status: 400 });
  }
}
