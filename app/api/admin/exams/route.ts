import { getChatGPTUser } from "../../../chatgpt-auth";
import { addQuizQuestion, ensureUserProfile, listQuizQuestions } from "../../../../lib/hsk-db";

async function getAdmin() {
  const user = await getChatGPTUser();
  if (!user) return null;
  const profile = await ensureUserProfile({ userId: user.userId, email: user.email, displayName: user.displayName });
  return profile.role === "admin" ? profile : null;
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
      questionNumber?: number; prompt?: string; choices?: string[]; answer?: string; mediaUrl?: string;
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
    };
    if (!values.levelId || !values.documentId || !values.part || !values.section || !values.format || !values.questionNumber || !values.prompt || values.choices.length < 2 || !values.answer || !values.choices.includes(values.answer)) {
      return Response.json({ error: "กรุณากรอกข้อมูลข้อสอบให้ครบ และคำตอบต้องอยู่ในตัวเลือก" }, { status: 400 });
    }
    return Response.json({ ok: true, question: await addQuizQuestion(values) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 400 });
  }
}
