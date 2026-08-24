import { getDevAuthCookieNames } from "../chatgpt-auth";
import { authenticateUser } from "../../lib/hsk-db";

export async function GET(request: Request) {
  const returnTo = safeReturnTo(new URL(request.url).searchParams.get("return_to"));
  return new Response(renderLoginPage(returnTo), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const returnTo = safeReturnTo(String(formData.get("return_to") ?? "/"));
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || password.length < 6) {
    return new Response(renderLoginPage(returnTo, "กรุณากรอกชื่อผู้ใช้ และรหัสผ่านอย่างน้อย 6 ตัวอักษร", username), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const account = await authenticateUser(username, password);
  if (!account) {
    return new Response(renderLoginPage(returnTo, "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", username), {
      status: 401,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const finalDisplayName = account.displayName || username || "HSK learner";
  const headers = new Headers({ Location: returnTo });
  setAuthCookies(headers, request.url, account.email, finalDisplayName);

  return new Response(null, { status: 302, headers });
}

function setAuthCookies(headers: Headers, requestUrl: string, email: string, displayName: string) {
  const cookies = getDevAuthCookieNames();
  const secure = requestUrl.startsWith("https://") ? "; Secure" : "";
  const base = `Path=/; SameSite=Lax; HttpOnly; Max-Age=${60 * 60 * 24 * 30}${secure}`;
  const userId = `email:${email}`;

  headers.append("Set-Cookie", `${cookies.userId}=${encodeURIComponent(userId)}; ${base}`);
  headers.append("Set-Cookie", `${cookies.email}=${encodeURIComponent(email)}; ${base}`);
  headers.append("Set-Cookie", `${cookies.displayName}=${encodeURIComponent(displayName)}; ${base}`);
}

function renderLoginPage(returnTo: string, error = "", username = "") {
  return `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>เข้าสู่ระบบ | HSK Studio</title>
  <style>
    :root { color-scheme: light; --page: #f7f3ec; --ink: #1f2428; --muted: #667069; --line: #ddd4c7; --paper: #fffdf8; --red: #dd4b39; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; background: var(--page); color: var(--ink); font-family: Arial, Helvetica, sans-serif; }
    main { width: min(100%, 420px); }
    a { color: inherit; }
    .brand { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 22px; text-decoration: none; font-weight: 900; }
    .mark { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 8px; background: var(--ink); color: var(--paper); font-size: 1.35rem; }
    form { border: 1px solid var(--line); border-radius: 8px; background: var(--paper); padding: 28px; box-shadow: 0 22px 60px rgba(41, 38, 32, 0.08); }
    h1 { margin: 0; font-size: 2rem; line-height: 1.08; }
    p { margin: 10px 0 24px; color: var(--muted); line-height: 1.6; }
    label { display: grid; gap: 8px; margin-top: 14px; color: var(--ink); font-size: 0.92rem; font-weight: 800; }
    input { width: 100%; min-height: 46px; border: 1px solid var(--line); border-radius: 8px; padding: 0 12px; background: white; color: var(--ink); font: inherit; }
    button { width: 100%; min-height: 48px; margin-top: 20px; border: 0; border-radius: 8px; background: var(--red); color: white; font: inherit; font-weight: 900; cursor: pointer; }
    .error { margin: 14px 0 0; padding: 10px 12px; border-radius: 8px; background: #fff1ef; color: #b12c1e; font-weight: 800; }
    .back { display: inline-flex; margin-top: 14px; color: var(--muted); text-decoration: none; font-weight: 800; }
  </style>
</head>
<body>
  <main>
    <a class="brand" href="/">
      <span class="mark">汉</span>
      <span>HSK Studio</span>
    </a>
    <form method="post" action="/login">
      <h1>เข้าสู่ระบบ</h1>
      <p>เข้าสู่ระบบด้วยชื่อผู้ใช้เพื่อบันทึกความคืบหน้า แบบทดสอบ และสถิติการเรียนของคุณ</p>
      <input type="hidden" name="return_to" value="${escapeHtml(returnTo)}" />
      <label>
        ชื่อผู้ใช้
        <input name="username" autocomplete="username" required value="${escapeHtml(username)}" placeholder="เช่น Sinaumza" />
      </label>
      <label>
        รหัสผ่าน
        <input name="password" type="password" autocomplete="current-password" minlength="6" required placeholder="อย่างน้อย 6 ตัวอักษร" />
      </label>
      ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
      <button type="submit">เข้าสู่ระบบ</button>
    </form>
    <a class="back" href="/register?return_to=${encodeURIComponent(returnTo)}">ยังไม่มีบัญชี? สมัครสมาชิก</a>
    <a class="back" href="/">กลับหน้าแรก</a>
  </main>
</body>
</html>`;
}

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
