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

  const finalDisplayName = account.displayName || username || "Chinese learner";
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
    @font-face { font-family: "Itim"; src: url("/fonts/Itim-Regular.ttf") format("truetype"); font-weight: 400 900; font-style: normal; font-display: swap; }
    :root { color-scheme: light; --page: #f7f3ec; --ink: #1f2428; --muted: #667069; --line: #ddd4c7; --paper: #fffdf8; --red: #dd4b39; --teal: #22806b; --gold: #f6bc50; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 28px; background-color: var(--page); background-image: linear-gradient(rgba(221, 212, 199, 0.52) 1px, transparent 1px), linear-gradient(90deg, rgba(221, 212, 199, 0.52) 1px, transparent 1px); background-size: 48px 48px; background-attachment: fixed; color: var(--ink); font-family: "Itim", "Mali", "Sriracha", "Leelawadee UI", "Segoe UI", Tahoma, Arial, sans-serif; font-size: 18px; font-feature-settings: "kern"; line-height: 1.62; text-rendering: optimizeLegibility; overflow-x: hidden; }
    body::before, body::after { position: fixed; z-index: 0; white-space: pre; pointer-events: none; font-weight: 900; opacity: .86; }
    body::before { left: 3vw; top: 8vh; color: rgba(221, 75, 57, 0.07); content: "你好        学习\\A\\A\\A汉语        声调\\A\\A\\A拼音        今天"; font-family: "Microsoft YaHei", "Noto Sans SC", sans-serif; font-size: clamp(1.35rem, 3vw, 4.1rem); line-height: 1.8; letter-spacing: .1em; word-spacing: 2.7rem; animation: driftLeft 18s ease-in-out infinite alternate; }
    body::after { right: 4vw; bottom: 6vh; color: rgba(34, 128, 107, 0.065); content: "ni hao          xue xi\\A\\A\\Ahan yu          pin yin\\A\\A\\Ayue du          ting li"; font-family: "Itim", "Mali", "Sriracha", "Leelawadee UI", sans-serif; font-size: clamp(1rem, 2.15vw, 2.6rem); line-height: 2; letter-spacing: .05em; word-spacing: 3rem; transform: rotate(6deg); animation: driftRight 22s ease-in-out infinite alternate-reverse; }
    main { position: relative; z-index: 1; width: min(100%, 980px); display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(360px, 440px); gap: 24px; align-items: stretch; }
    a { color: inherit; }
    .brand { position: absolute; top: 18px; left: 18px; display: inline-flex; align-items: center; gap: 10px; text-decoration: none; font-weight: 900; }
    .mark { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 14px; background: var(--ink); color: var(--paper); font-family: "Microsoft YaHei UI", "Microsoft YaHei", SimHei, sans-serif; font-size: 1.35rem; box-shadow: 0 14px 30px rgba(31, 36, 40, 0.18); }
    .showcase, form { min-height: 560px; border: 1px solid rgba(221, 212, 199, 0.78); border-radius: 28px; background: rgba(255, 253, 248, 0.76); box-shadow: 0 26px 80px rgba(41, 38, 32, 0.14); backdrop-filter: blur(22px); }
    .showcase { position: relative; display: grid; align-content: end; overflow: hidden; padding: 32px; background: linear-gradient(145deg, rgba(31, 36, 40, 0.95), rgba(34, 128, 107, 0.86)); color: white; }
    .showcase::before { position: absolute; inset: 18px; border: 1px dashed rgba(255, 255, 255, 0.16); border-radius: 22px; content: ""; }
    .hero-hanzi { position: absolute; top: 76px; right: 34px; color: rgba(255, 255, 255, 0.12); font-family: "Microsoft YaHei", sans-serif; font-size: 13rem; font-weight: 950; line-height: 1; animation: pulse 4s ease-in-out infinite; }
    .floating-chip { position: absolute; display: inline-flex; min-height: 38px; align-items: center; padding: 0 14px; border: 1px solid rgba(255,255,255,.18); border-radius: 999px; background: rgba(255,255,255,.11); color: rgba(255,255,255,.82); font-size: .8rem; font-weight: 900; animation: float 5s ease-in-out infinite; }
    .chip-1 { top: 118px; left: 34px; } .chip-2 { top: 206px; left: 86px; animation-delay: .7s; } .chip-3 { top: 294px; left: 44px; animation-delay: 1.4s; }
    .showcase-copy { position: relative; z-index: 1; }
    .showcase-copy span, .kicker { color: var(--gold); font-size: .78rem; font-weight: 950; text-transform: uppercase; }
    .showcase-copy h2 { margin: 10px 0 12px; font-size: clamp(2.5rem, 5vw, 4.2rem); line-height: 1.02; }
    .showcase-copy p { margin: 0; color: rgba(255,255,255,.78); max-width: 420px; }
    form { position: relative; padding: 84px 30px 28px; overflow: hidden; }
    form::before { position: absolute; inset: 14px; border: 1px dashed rgba(31,36,40,.12); border-radius: 22px; content: ""; pointer-events: none; }
    h1 { position: relative; margin: 0; font-size: 2.35rem; line-height: 1.08; }
    p { position: relative; margin: 10px 0 24px; color: var(--muted); line-height: 1.6; }
    label { position: relative; display: grid; gap: 8px; margin-top: 14px; color: var(--ink); font-size: 0.92rem; font-weight: 850; }
    .field { position: relative; }
    input { width: 100%; min-height: 50px; border: 1px solid rgba(221, 212, 199, .95); border-radius: 15px; padding: 0 48px 0 14px; background: rgba(255,255,255,.82); color: var(--ink); font: inherit; box-shadow: inset 0 1px 0 rgba(255,255,255,.9); transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease; }
    input:focus { border-color: rgba(34,128,107,.62); outline: 0; box-shadow: 0 0 0 4px rgba(34,128,107,.12), inset 0 1px 0 rgba(255,255,255,.9); transform: translateY(-1px); }
    .field-icon { position: absolute; right: 14px; top: 50%; color: var(--teal); font-weight: 950; transform: translateY(-50%); pointer-events: none; }
    .toggle-password { position: absolute; right: 8px; top: 50%; width: 38px; min-height: 34px; margin: 0; border-radius: 12px; background: rgba(31,36,40,.08); color: var(--ink); transform: translateY(-50%); }
    button { width: 100%; min-height: 52px; margin-top: 20px; border: 0; border-radius: 16px; background: linear-gradient(135deg, var(--red), #f06d48); color: white; font: inherit; font-weight: 950; cursor: pointer; box-shadow: 0 16px 34px rgba(221,75,57,.24); transition: transform .16s ease, box-shadow .16s ease; }
    button:hover { transform: translateY(-2px); box-shadow: 0 20px 42px rgba(221,75,57,.3); }
    button:disabled { cursor: wait; opacity: 0.82; }
    .button-content { display: inline-flex; align-items: center; justify-content: center; gap: 10px; }
    .spinner { display: none; width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.45); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
    button.is-loading .spinner { display: inline-block; }
    .auth-meta { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 20px 0 0; }
    .auth-meta span { padding: 9px; border: 1px solid var(--line); border-radius: 14px; background: rgba(255,255,255,.56); color: var(--muted); font-size: .72rem; font-weight: 900; text-align: center; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes driftLeft { to { transform: translate3d(-2.5vw, 2vh, 0) rotate(-2deg); } }
    @keyframes driftRight { to { transform: translate3d(2.5vw, -2vh, 0) rotate(3deg); } }
    @keyframes float { 50% { transform: translateY(-14px); } }
    @keyframes pulse { 50% { transform: scale(1.04) rotate(-2deg); } }
    .loading-overlay { position: fixed; inset: 0; z-index: 10; display: none; place-items: center; padding: 24px; background: rgba(31, 36, 40, 0.58); backdrop-filter: blur(12px); }
    .loading-overlay.is-visible { display: grid; }
    .loading-modal { width: min(100%, 340px); display: grid; justify-items: center; gap: 14px; padding: 30px 24px; border: 1px solid rgba(255,255,255,.22); border-radius: 24px; background: rgba(255,253,248,.92); box-shadow: 0 26px 80px rgba(0,0,0,.28); text-align: center; }
    .loading-modal .spinner { display: block; width: 34px; height: 34px; border-color: rgba(221, 75, 57, 0.25); border-top-color: var(--red); }
    .loading-text { margin: 0; color: var(--ink); font-weight: 900; }
    .loading-steps { width: 100%; display: grid; gap: 7px; color: var(--muted); font-size: .78rem; font-weight: 850; }
    .loading-steps i { height: 6px; border-radius: 999px; background: linear-gradient(90deg, var(--teal), var(--gold), var(--red)); animation: loadbar 1.2s ease-in-out infinite alternate; }
    @keyframes loadbar { from { width: 42%; } to { width: 100%; } }
    .error { position: relative; margin: 14px 0 0; padding: 10px 12px; border: 1px solid #ffc9c1; border-radius: 14px; background: #fff1ef; color: #b12c1e; font-weight: 850; }
    .links { position: relative; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; margin-top: 16px; }
    .back { display: inline-flex; color: var(--muted); text-decoration: none; font-weight: 850; }
    .back:hover { color: var(--red); }
    @media (max-width: 860px) { main { grid-template-columns: 1fr; max-width: 470px; } .showcase { display: none; } form { min-height: 0; } body::before { left: -8vw; top: 3vh; font-size: clamp(1.2rem, 7vw, 2.8rem); line-height: 2.15; } body::after { right: -10vw; bottom: 2vh; font-size: clamp(.95rem, 5vw, 2rem); line-height: 2.3; opacity: .55; } }
    @media (max-width: 520px) { body { padding: 16px; } body::before { content: "你好\\A\\A\\A学习\\A\\A\\A汉语"; } body::after { content: "ni hao\\A\\A\\Axue xi\\A\\A\\Apin yin"; } form { padding: 78px 20px 22px; border-radius: 22px; } h1 { font-size: 2rem; } .auth-meta { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main>
    <section class="showcase" aria-hidden="true">
      <span class="hero-hanzi">学</span>
      <span class="floating-chip chip-1">声调 sheng diao</span>
      <span class="floating-chip chip-2">听力 ting li</span>
      <span class="floating-chip chip-3">阅读 yue du</span>
      <div class="showcase-copy"><span>HSK Studio</span><h2>กลับมาเรียนต่อให้ลื่นกว่าเดิม</h2><p>เก็บความคืบหน้า สถิติ และชุดข้อสอบของคุณไว้ในที่เดียว</p></div>
    </section>
    <form method="post" action="/login">
      <a class="brand" href="/">
        <span class="mark">汉</span>
        <span>HSK Studio</span>
      </a>
      <span class="kicker">Welcome Back</span>
      <h1>เข้าสู่ระบบ</h1>
      <p>เข้าสู่ระบบด้วยชื่อผู้ใช้เพื่อบันทึกความคืบหน้า แบบทดสอบ และสถิติการเรียนของคุณ</p>
      <input type="hidden" name="return_to" value="${escapeHtml(returnTo)}" />
      <label>
        ชื่อผู้ใช้
        <span class="field"><input name="username" autocomplete="username" required value="${escapeHtml(username)}" placeholder="เช่น Sinaumza" /><span class="field-icon">人</span></span>
      </label>
      <label>
        รหัสผ่าน
        <span class="field"><input id="password" name="password" type="password" autocomplete="current-password" minlength="6" required placeholder="อย่างน้อย 6 ตัวอักษร" /><button class="toggle-password" type="button" data-toggle-password="password" aria-label="แสดงหรือซ่อนรหัสผ่าน">ดู</button></span>
      </label>
      ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
      <div class="auth-meta"><span>บันทึกสถิติ</span><span>ทำข้อสอบ</span><span>ทบทวนศัพท์</span></div>
      <button type="submit">
        <span class="button-content" aria-live="polite">
          <span class="button-label">เข้าสู่ระบบ</span>
          <span class="spinner" aria-hidden="true"></span>
        </span>
      </button>
      <div class="links">
        <a class="back" href="/register?return_to=${encodeURIComponent(returnTo)}">ยังไม่มีบัญชี? สมัครสมาชิก</a>
        <a class="back" href="/">กลับหน้าแรก</a>
      </div>
    </form>
  </main>
  <div class="loading-overlay" role="status" aria-live="polite" aria-hidden="true">
    <div class="loading-modal">
      <span class="spinner" aria-hidden="true"></span>
      <p class="loading-text">กำลังเข้าสู่ระบบ...</p>
      <div class="loading-steps"><i></i><span>กำลังตรวจสอบบัญชีและเปิดพื้นที่เรียนของคุณ</span></div>
    </div>
  </div>
</body>
<script>
  document.querySelectorAll("[data-toggle-password]").forEach(function (button) {
    button.addEventListener("click", function () {
      const input = document.getElementById(button.getAttribute("data-toggle-password"));
      if (!input) return;
      const visible = input.getAttribute("type") === "text";
      input.setAttribute("type", visible ? "password" : "text");
      button.textContent = visible ? "ดู" : "ซ่อน";
    });
  });
  document.querySelector("form")?.addEventListener("submit", function () {
    const button = this.querySelector("button");
    const label = this.querySelector(".button-label");
    const loadingOverlay = document.querySelector(".loading-overlay");
    if (!button || !label) return;
    button.disabled = true;
    button.classList.add("is-loading");
    label.textContent = "กำลังเข้าสู่ระบบ...";
    loadingOverlay?.classList.add("is-visible");
    loadingOverlay?.setAttribute("aria-hidden", "false");
  });
</script>
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
