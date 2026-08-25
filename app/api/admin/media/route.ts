import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { ensureUserProfile } from "../../../../lib/hsk-db";

const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
const allowedAudioTypes = new Set(["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/mp4", "audio/x-m4a"]);
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

async function requireAdmin() {
  const user = await getChatGPTUser();
  if (!user) return null;
  const profile = await ensureUserProfile({ userId: user.userId, email: user.email, displayName: user.displayName });
  return profile.role === "admin" ? profile : null;
}

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) return Response.json({ error: "Admin access required" }, { status: 403 });
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return Response.json({ error: "กรุณาเลือกไฟล์เสียง" }, { status: 400 });
    if (!allowedAudioTypes.has(file.type) && !allowedImageTypes.has(file.type)) return Response.json({ error: "รองรับไฟล์เสียง MP3, WAV, OGG, M4A หรือรูป JPG, PNG, WEBP, GIF เท่านั้น" }, { status: 400 });
    if (file.size > MAX_AUDIO_BYTES) return Response.json({ error: "ไฟล์เสียงต้องมีขนาดไม่เกิน 50 MB" }, { status: 400 });
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp3";
    const key = `audio/${crypto.randomUUID()}.${extension}`;
    await env.AUDIO_BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type, contentDisposition: "inline" } });
    return Response.json({ ok: true, key, mediaUrl: `/api/media/${key}` }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "อัปโหลดไฟล์ไม่สำเร็จ" }, { status: 400 });
  }
}
