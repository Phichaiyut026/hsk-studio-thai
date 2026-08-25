import { getChatGPTUser } from "../../../chatgpt-auth";
import { addQuizQuestion, deleteQuizQuestion, ensureUserProfile, listQuizQuestions, updateQuizQuestion } from "../../../../lib/hsk-db";

async function getAdmin() {
  const user = await getChatGPTUser();
  if (!user) return null;
  const profile = await ensureUserProfile({ userId: user.userId, email: user.email, displayName: user.displayName });
  return profile.role === "admin" ? profile : null;
}

const hsk1Blueprint = [
  { part: "listening", section: "1", from: 1, to: 5, format: "true-false" },
  { part: "listening", section: "2", from: 6, to: 10, format: "image-choice" },
  { part: "listening", section: "3", from: 11, to: 15, format: "matching" },
  { part: "listening", section: "4", from: 16, to: 20, format: "choice" },
  { part: "reading", section: "1", from: 21, to: 25, format: "true-false" },
  { part: "reading", section: "2", from: 26, to: 30, format: "matching" },
  { part: "reading", section: "3", from: 31, to: 35, format: "matching" },
  { part: "reading", section: "4", from: 36, to: 40, format: "fill-blank" },
] as const;

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
      questionNumber?: number; prompt?: string; choices?: string[]; answer?: string; mediaUrl?: string; imageUrl?: string;
    };
    const values = {
      levelId: payload.levelId?.trim() ?? "",
      documentId: payload.documentId?.trim() ?? "",
      part: payload.part?.trim() ?? "",
      section: payload.section?.trim() ?? "",
      format: payload.format?.trim() ?? "",
      questionNumber: Number(payload.questionNumber ?? 0),
      prompt: payload.prompt?.trim() ?? "",
      choices: Array.isArray(payload.choices) ? payload.choices.map((choice) => choice.trim()).filter(Boolean) : [],
      answer: payload.answer?.trim() ?? "",
      mediaUrl: payload.mediaUrl?.trim() ?? "",
      imageUrl: payload.imageUrl?.trim() ?? "",
    };
    const isListeningTrueFalse = values.part === "listening" && values.section === "1" && values.format === "true-false";
    const isListeningImageChoice = values.part === "listening" && values.format === "image-choice";
    const isListeningImageMatching = values.part === "listening" && values.section === "3" && values.format === "matching";
    if (isListeningTrueFalse) values.choices = ["ถูก", "ผิด"];
    if (isListeningImageChoice) values.choices = ["A", "B", "C"];
    if (isListeningImageMatching) values.choices = ["A", "B", "C", "D", "E"];
    if (!values.levelId || !values.documentId || !values.part || !values.section || !values.format || !values.questionNumber || (!isListeningTrueFalse && !isListeningImageChoice && !isListeningImageMatching && !values.prompt) || values.choices.length < 2 || !values.answer || !values.choices.includes(values.answer)) {
      return Response.json({ error: "กรุณากรอกข้อมูลข้อสอบให้ครบ และคำตอบต้องอยู่ในตัวเลือก" }, { status: 400 });
    }
    if (values.levelId === "hsk1") {
      const section = hsk1Blueprint.find((item) => item.part === values.part && item.section === values.section);
      if (!section || values.questionNumber < section.from || values.questionNumber > section.to || values.format !== section.format) {
        return Response.json({ error: "ข้อสอบ HSK 1 ไม่ตรงกับ Blueprint ของพาร์ต/ส่วน/เลขข้อที่เลือก" }, { status: 400 });
      }
    }
    return Response.json({ ok: true, question: await addQuizQuestion(values) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 400 });
  }
}

async function parseQuestionPayload(request: Request) {
  const payload = (await request.json()) as {
    levelId?: string; documentId?: string; part?: string; section?: string; format?: string;
    questionNumber?: number; prompt?: string; choices?: string[]; answer?: string; mediaUrl?: string; imageUrl?: string;
  };
  return {
    levelId: payload.levelId?.trim() ?? "", documentId: payload.documentId?.trim() ?? "", part: payload.part?.trim() ?? "",
    section: payload.section?.trim() ?? "", format: payload.format?.trim() ?? "", questionNumber: Number(payload.questionNumber ?? 0),
    prompt: payload.prompt?.trim() ?? "", choices: Array.isArray(payload.choices) ? payload.choices.map((choice) => choice.trim()).filter(Boolean) : [],
    answer: payload.answer?.trim() ?? "", mediaUrl: payload.mediaUrl?.trim() ?? "", imageUrl: payload.imageUrl?.trim() ?? "",
  };
}

export async function PATCH(request: Request) {
  try {
    if (!(await getAdmin())) return Response.json({ error: "Admin access required" }, { status: 403 });
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "Missing question id" }, { status: 400 });
    const values = await parseQuestionPayload(request);
    if (!values.levelId || !values.documentId || !values.part || !values.section || !values.format || !values.questionNumber || !values.prompt && !(values.part === "listening" && ["true-false", "image-choice", "matching"].includes(values.format)) || values.choices.length < 2 || !values.answer || !values.choices.includes(values.answer)) return Response.json({ error: "ข้อมูลข้อสอบไม่ครบ" }, { status: 400 });
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
