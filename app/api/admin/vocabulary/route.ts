import { getChatGPTUser } from "../../../chatgpt-auth";
import { addVocabularyWord, deleteVocabularyWord, ensureUserProfile, listVocabulary, updateVocabularyWord } from "../../../../lib/hsk-db";

async function getAdmin() {
  const user = await getChatGPTUser();
  if (!user) return null;
  const profile = await ensureUserProfile({
    userId: user.userId,
    email: user.email,
    displayName: user.displayName,
  });
  return profile.role === "admin" ? profile : null;
}

export async function POST(request: Request) {
  try {
    if (!(await getAdmin())) return Response.json({ error: "Admin access required" }, { status: 403 });

    const payload = (await request.json()) as {
      levelId?: string;
      hanzi?: string;
      pinyin?: string;
      thai?: string;
      example?: string;
    };
    const values = {
      levelId: payload.levelId?.trim() ?? "",
      hanzi: payload.hanzi?.trim() ?? "",
      pinyin: payload.pinyin?.trim() ?? "",
      thai: payload.thai?.trim() ?? "",
      example: payload.example?.trim() ?? "",
    };

    if (!values.levelId || !values.hanzi || !values.pinyin || !values.thai || !values.example) {
      return Response.json({ error: "กรุณากรอกข้อมูลคำศัพท์ให้ครบ" }, { status: 400 });
    }

    return Response.json({ ok: true, word: await addVocabularyWord(values) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (!(await getAdmin())) return Response.json({ error: "Admin access required" }, { status: 403 });
    return Response.json({ vocabulary: await listVocabulary() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await getAdmin())) return Response.json({ error: "Admin access required" }, { status: 403 });
    const payload = (await request.json()) as { id?: string; levelId?: string; hanzi?: string; pinyin?: string; thai?: string; example?: string };
    const values = { levelId: payload.levelId?.trim() ?? "", hanzi: payload.hanzi?.trim() ?? "", pinyin: payload.pinyin?.trim() ?? "", thai: payload.thai?.trim() ?? "", example: payload.example?.trim() ?? "" };
    if (!payload.id || Object.values(values).some((value) => !value)) return Response.json({ error: "กรุณากรอกข้อมูลคำศัพท์ให้ครบ" }, { status: 400 });
    await updateVocabularyWord(payload.id, values);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await getAdmin())) return Response.json({ error: "Admin access required" }, { status: 403 });
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) return Response.json({ error: "Vocabulary id is required" }, { status: 400 });
    await deleteVocabularyWord(id);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 400 });
  }
}
