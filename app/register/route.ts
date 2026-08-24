import { getDevAuthCookieNames } from "../chatgpt-auth";
import { registerUser } from "../../lib/hsk-db";

export async function GET(request: Request) {
  const returnTo = safeReturnTo(new URL(request.url).searchParams.get("return_to"));
  return new Response(renderRegisterPage(returnTo), { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const returnTo = safeReturnTo(String(formData.get("return_to") ?? "/"));
  const displayName = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!displayName || !isValidEmail(email) || password.length < 6 || password !== confirmPassword) {
    return new Response(renderRegisterPage(returnTo, "กรุณากรอกข้อมูลให้ครบ และตรวจสอบรหัสผ่านอีกครั้ง", displayName, email), { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  try {
    const account = await registerUser({ displayName, email, password });
    const headers = new Headers({ Location: returnTo });
    setAuthCookies(headers, request.url, account.userId, account.email, account.displayName);
    return new Response(null, { status: 302, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "สมัครสมาชิกไม่สำเร็จ";
    return new Response(renderRegisterPage(returnTo, message, displayName, email), { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
}

function setAuthCookies(headers: Headers, requestUrl: string, userId: string, email: string, displayName: string) {
  const cookies = getDevAuthCookieNames();
  const secure = requestUrl.startsWith("https://") ? "; Secure" : "";
  const base = `Path=/; SameSite=Lax; HttpOnly; Max-Age=${60 * 60 * 24 * 30}${secure}`;
  headers.append("Set-Cookie", `${cookies.userId}=${encodeURIComponent(userId)}; ${base}`);
  headers.append("Set-Cookie", `${cookies.email}=${encodeURIComponent(email)}; ${base}`);
  headers.append("Set-Cookie", `${cookies.displayName}=${encodeURIComponent(displayName)}; ${base}`);
}

function renderRegisterPage(returnTo: string, error = "", displayName = "", email = "") {
  return `<!doctype html><html lang="th"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>สมัครสมาชิก | HSK Studio</title><style>
  :root { --page:#f7f3ec; --ink:#1f2428; --muted:#667069; --line:#ddd4c7; --paper:#fffdf8; --red:#dd4b39; } *{box-sizing:border-box} body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:var(--page);color:var(--ink);font-family:Arial,Helvetica,sans-serif} main{width:min(100%,420px)} a{color:inherit}.brand{display:inline-flex;align-items:center;gap:10px;margin-bottom:22px;text-decoration:none;font-weight:900}.mark{width:42px;height:42px;display:grid;place-items:center;border-radius:8px;background:var(--ink);color:var(--paper);font-size:1.35rem}form{border:1px solid var(--line);border-radius:8px;background:var(--paper);padding:28px;box-shadow:0 22px 60px rgba(41,38,32,.08)}h1{margin:0;font-size:2rem;line-height:1.08}p{margin:10px 0 24px;color:var(--muted);line-height:1.6}label{display:grid;gap:8px;margin-top:14px;font-size:.92rem;font-weight:800}input{width:100%;min-height:46px;border:1px solid var(--line);border-radius:8px;padding:0 12px;background:white;color:var(--ink);font:inherit}button{width:100%;min-height:48px;margin-top:20px;border:0;border-radius:8px;background:var(--red);color:white;font:inherit;font-weight:900;cursor:pointer}.error{margin:14px 0 0;padding:10px 12px;border-radius:8px;background:#fff1ef;color:#b12c1e;font-weight:800}.back{display:inline-flex;margin-top:14px;color:var(--muted);text-decoration:none;font-weight:800}
  </style></head><body><main><a class="brand" href="/"><span class="mark">汉</span><span>HSK Studio</span></a><form method="post" action="/register"><h1>สมัครสมาชิก</h1><p>สร้างบัญชีเพื่อเก็บความคืบหน้า สถิติ และผลการเรียนของคุณ</p><input type="hidden" name="return_to" value="${escapeHtml(returnTo)}" /><label>ชื่อผู้ใช้<input name="display_name" autocomplete="name" required value="${escapeHtml(displayName)}" placeholder="เช่น Sinaumza" /></label><label>อีเมล<input name="email" type="email" autocomplete="email" required value="${escapeHtml(email)}" placeholder="you@example.com" /></label><label>รหัสผ่าน<input name="password" type="password" autocomplete="new-password" minlength="6" required placeholder="อย่างน้อย 6 ตัวอักษร" /></label><label>ยืนยันรหัสผ่าน<input name="confirm_password" type="password" autocomplete="new-password" minlength="6" required placeholder="กรอกรหัสผ่านอีกครั้ง" /></label>${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}<button type="submit">สมัครสมาชิก</button></form><a class="back" href="/login?return_to=${encodeURIComponent(returnTo)}">มีบัญชีแล้ว? เข้าสู่ระบบ</a></main></body></html>`;
}

function safeReturnTo(value: string | null) { if (!value || !value.startsWith("/") || value.startsWith("//")) return "/"; return value; }
function isValidEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function escapeHtml(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
