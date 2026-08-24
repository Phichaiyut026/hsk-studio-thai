import { getChatGPTUser } from "../../../chatgpt-auth";
import { ensureUserProfile, listUsers, registerUser, updateUserRole, type AppRole } from "../../../../lib/hsk-db";

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

export async function GET() {
  try {
    if (!(await getAdmin())) return Response.json({ error: "Admin access required" }, { status: 403 });
    return Response.json({ users: await listUsers() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getAdmin();
    if (!admin) return Response.json({ error: "Admin access required" }, { status: 403 });

    const payload = (await request.json()) as { userId?: string; role?: AppRole };
    const userId = payload.userId?.trim();
    const role = payload.role;
    if (!userId || (role !== "user" && role !== "admin")) {
      return Response.json({ error: "userId and a valid role are required" }, { status: 400 });
    }
    if (userId === admin.userId) {
      return Response.json({ error: "You cannot change your own role" }, { status: 400 });
    }

    await updateUserRole(userId, role);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await getAdmin())) return Response.json({ error: "Admin access required" }, { status: 403 });
    const payload = (await request.json()) as { displayName?: string; email?: string; password?: string; role?: AppRole };
    const displayName = payload.displayName?.trim() ?? "";
    const email = payload.email?.trim().toLowerCase() ?? "";
    const password = payload.password ?? "";
    if (!displayName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6 || (payload.role !== "user" && payload.role !== "admin")) {
      return Response.json({ error: "กรุณากรอกชื่อ อีเมล รหัสผ่าน และสิทธิ์ให้ถูกต้อง" }, { status: 400 });
    }
    return Response.json({ ok: true, user: await registerUser({ displayName, email, password, role: payload.role }) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 400 });
  }
}
