import { getChatGPTUser } from "../../../chatgpt-auth";
import {
  deleteUser,
  ensureUserProfile,
  listUsers,
  registerUser,
  setUserDisabled,
  updateUserAccount,
  updateUserRole,
  type AppRole,
} from "../../../../lib/hsk-db";

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

    const payload = (await request.json()) as {
      action?: "role" | "update" | "status";
      userId?: string;
      role?: AppRole;
      displayName?: string;
      email?: string;
      password?: string;
      disabled?: boolean;
    };
    const userId = payload.userId?.trim();
    if (!userId) return Response.json({ error: "userId is required" }, { status: 400 });

    if (!payload.action || payload.action === "role") {
      if (payload.role !== "user" && payload.role !== "admin") {
        return Response.json({ error: "A valid role is required" }, { status: 400 });
      }
      if (userId === admin.userId) return Response.json({ error: "You cannot change your own role" }, { status: 400 });
      await updateUserRole(userId, payload.role);
    } else if (payload.action === "update") {
      const displayName = payload.displayName?.trim() ?? "";
      const email = payload.email?.trim().toLowerCase() ?? "";
      if (!displayName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || (payload.password && payload.password.length < 6) || (payload.role !== "user" && payload.role !== "admin")) {
        return Response.json({ error: "กรุณากรอกข้อมูลผู้ใช้ให้ถูกต้อง" }, { status: 400 });
      }
      await updateUserAccount({ userId, displayName, email, password: payload.password, role: payload.role });
    } else {
      if (userId === admin.userId) return Response.json({ error: "คุณไม่สามารถปิดใช้งานบัญชีตัวเองได้" }, { status: 400 });
      if (typeof payload.disabled !== "boolean") return Response.json({ error: "disabled must be boolean" }, { status: 400 });
      await setUserDisabled(userId, payload.disabled);
    }
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await getAdmin();
    if (!admin) return Response.json({ error: "Admin access required" }, { status: 403 });
    const payload = (await request.json()) as { userId?: string };
    const userId = payload.userId?.trim();
    if (!userId) return Response.json({ error: "userId is required" }, { status: 400 });
    if (userId === admin.userId) return Response.json({ error: "คุณไม่สามารถลบบัญชีตัวเองได้" }, { status: 400 });
    await deleteUser(userId);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 400 });
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
