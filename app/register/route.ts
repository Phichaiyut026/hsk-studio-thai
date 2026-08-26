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
  return `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>สมัครสมาชิก | HSK Studio</title>
  <style>
    @font-face { font-family: "Itim"; src: url("/fonts/Itim-Regular.ttf") format("truetype"); font-weight: 400 900; font-style: normal; font-display: swap; }
    :root { color-scheme: light; --page: #f7f3ec; --ink: #1f2428; --muted: #667069; --line: #ddd4c7; --paper: #fffdf8; --red: #dd4b39; --teal: #22806b; --gold: #f6bc50; --blue: #557a9d; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 28px; background-color: var(--page); background-image: linear-gradient(rgba(221, 212, 199, 0.52) 1px, transparent 1px), linear-gradient(90deg, rgba(221, 212, 199, 0.52) 1px, transparent 1px); background-size: 48px 48px; background-attachment: fixed; color: var(--ink); font-family: "Itim", "Mali", "Sriracha", "Leelawadee UI", "Segoe UI", Tahoma, Arial, sans-serif; font-size: 18px; line-height: 1.62; text-rendering: optimizeLegibility; overflow-x: hidden; }
    body::before, body::after { position: fixed; z-index: 0; white-space: pre; pointer-events: none; font-weight: 950; opacity: .86; }
    body::before { left: 3vw; top: 8vh; color: rgba(34, 128, 107, 0.075); content: "注册        账号\\A\\A\\A学习        目标\\A\\A\\A进步        汉语"; font-family: "Microsoft YaHei", "Noto Sans SC", sans-serif; font-size: clamp(1.35rem, 3vw, 4.1rem); line-height: 1.85; letter-spacing: .1em; word-spacing: 2.7rem; animation: driftLeft 20s ease-in-out infinite alternate; }
    body::after { right: 4vw; bottom: 6vh; color: rgba(221, 75, 57, 0.065); content: "zhu ce          xue xi\\A\\A\\Amu biao         jin bu\\A\\A\\Ahan yu          pin yin"; font-family: "Itim", "Mali", "Sriracha", "Leelawadee UI", sans-serif; font-size: clamp(1rem, 2.15vw, 2.6rem); line-height: 2; letter-spacing: .05em; word-spacing: 3rem; transform: rotate(-6deg); animation: driftRight 24s ease-in-out infinite alternate-reverse; }
    main { position: relative; z-index: 1; width: min(100%, 1040px); display: grid; grid-template-columns: minmax(380px, 460px) minmax(0, 0.92fr); gap: 24px; align-items: stretch; }
    a { color: inherit; }
    .brand { position: absolute; top: 18px; left: 18px; display: inline-flex; align-items: center; gap: 10px; text-decoration: none; font-weight: 900; }
    .mark { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 14px; background: var(--ink); color: var(--paper); font-family: "Microsoft YaHei UI", "Microsoft YaHei", SimHei, sans-serif; font-size: 1.35rem; box-shadow: 0 14px 30px rgba(31, 36, 40, 0.18); }
    form, .showcase { min-height: 620px; border: 1px solid rgba(221, 212, 199, 0.78); border-radius: 28px; background: rgba(255, 253, 248, 0.78); box-shadow: 0 26px 80px rgba(41, 38, 32, 0.14); backdrop-filter: blur(22px); }
    form { position: relative; padding: 84px 30px 28px; overflow: hidden; }
    form::before, .showcase::before { position: absolute; inset: 14px; border: 1px dashed rgba(31,36,40,.12); border-radius: 22px; content: ""; pointer-events: none; }
    .kicker, .showcase-copy span { color: var(--red); font-size: .78rem; font-weight: 950; text-transform: uppercase; }
    h1 { position: relative; margin: 0; font-size: 2.3rem; line-height: 1.08; }
    p { position: relative; margin: 10px 0 22px; color: var(--muted); line-height: 1.6; }
    label { position: relative; display: grid; gap: 8px; margin-top: 13px; color: var(--ink); font-size: 0.9rem; font-weight: 850; }
    .field { position: relative; }
    input { width: 100%; min-height: 50px; border: 1px solid rgba(221, 212, 199, .95); border-radius: 15px; padding: 0 48px 0 14px; background: rgba(255,255,255,.84); color: var(--ink); font: inherit; box-shadow: inset 0 1px 0 rgba(255,255,255,.9); transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease; }
    input:focus { border-color: rgba(34,128,107,.62); outline: 0; box-shadow: 0 0 0 4px rgba(34,128,107,.12), inset 0 1px 0 rgba(255,255,255,.9); transform: translateY(-1px); }
    .field-icon { position: absolute; right: 14px; top: 50%; color: var(--teal); font-weight: 950; transform: translateY(-50%); pointer-events: none; }
    .toggle-password { position: absolute; right: 8px; top: 50%; width: 38px; min-height: 34px; margin: 0; border-radius: 12px; background: rgba(31,36,40,.08); color: var(--ink); box-shadow: none; transform: translateY(-50%); }
    .strength { display: grid; gap: 6px; margin-top: 10px; color: var(--muted); font-size: .74rem; font-weight: 850; }
    .strength i { height: 7px; width: 0%; border-radius: 999px; background: linear-gradient(90deg, var(--red), var(--gold), var(--teal)); transition: width .2s ease; }
    .match { min-height: 18px; margin-top: 6px; color: var(--muted); font-size: .74rem; font-weight: 850; }
    button { width: 100%; min-height: 52px; margin-top: 20px; border: 0; border-radius: 16px; background: linear-gradient(135deg, var(--teal), #35b195); color: white; font: inherit; font-weight: 950; cursor: pointer; box-shadow: 0 16px 34px rgba(34,128,107,.24); transition: transform .16s ease, box-shadow .16s ease; }
    button:hover { transform: translateY(-2px); box-shadow: 0 20px 42px rgba(34,128,107,.3); }
    button:disabled { cursor: wait; opacity: .82; }
    .button-content { display: inline-flex; align-items: center; justify-content: center; gap: 10px; }
    .spinner { display: none; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.45); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }
    button.is-loading .spinner { display: inline-block; }
    .showcase { position: relative; display: grid; align-content: space-between; overflow: hidden; padding: 32px; background: linear-gradient(145deg, rgba(255,253,248,.86), rgba(238,248,245,.78)); }
    .orbit { position: absolute; width: 260px; height: 260px; right: -62px; top: 58px; border: 1px solid rgba(34,128,107,.18); border-radius: 50%; animation: spin 18s linear infinite; }
    .orbit::before, .orbit::after { position: absolute; width: 48px; height: 48px; display: grid; place-items: center; border-radius: 16px; background: var(--ink); color: white; content: "词"; font-family: "Microsoft YaHei", sans-serif; font-weight: 900; }
    .orbit::before { left: 8px; top: 34px; } .orbit::after { right: 12px; bottom: 42px; content: "考"; background: var(--red); }
    .showcase-card { position: relative; z-index: 1; width: min(100%, 360px); margin-top: 84px; padding: 22px; border: 1px solid rgba(31,36,40,.1); border-radius: 22px; background: rgba(255,255,255,.68); box-shadow: 0 20px 48px rgba(31,36,40,.1); }
    .showcase-card strong { display: block; color: var(--ink); font-size: 4.6rem; line-height: 1; text-align: center; }
    .showcase-card small { display: block; color: var(--teal); font-weight: 900; text-align: center; }
    .showcase-copy { position: relative; z-index: 1; }
    .showcase-copy h2 { margin: 10px 0 12px; font-size: clamp(2rem, 4vw, 3.5rem); line-height: 1.05; }
    .feature-list { position: relative; z-index: 1; display: grid; gap: 9px; margin-top: 18px; }
    .feature-list span { padding: 10px 12px; border: 1px solid rgba(31,36,40,.08); border-radius: 14px; background: rgba(255,255,255,.5); color: var(--muted); font-size: .82rem; font-weight: 900; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes driftLeft { to { transform: translate3d(2.5vw, 2vh, 0) rotate(2deg); } }
    @keyframes driftRight { to { transform: translate3d(-2.5vw, -2vh, 0) rotate(-3deg); } }
    .loading-overlay { position: fixed; inset: 0; z-index: 10; display: none; place-items: center; padding: 24px; background: rgba(31,36,40,.58); backdrop-filter: blur(12px); }
    .loading-overlay.is-visible { display: grid; }
    .loading-modal { width: min(100%, 340px); display: grid; justify-items: center; gap: 14px; padding: 30px 24px; border: 1px solid rgba(255,255,255,.22); border-radius: 24px; background: rgba(255,253,248,.92); box-shadow: 0 26px 80px rgba(0,0,0,.28); text-align: center; }
    .loading-modal .spinner { display: block; width: 34px; height: 34px; border-color: rgba(34,128,107,.25); border-top-color: var(--teal); }
    .loading-text { margin: 0; color: var(--ink); font-weight: 900; }
    .loading-steps { width: 100%; display: grid; gap: 7px; color: var(--muted); font-size: .78rem; font-weight: 850; }
    .loading-steps i { height: 6px; border-radius: 999px; background: linear-gradient(90deg, var(--teal), var(--gold), var(--red)); animation: loadbar 1.2s ease-in-out infinite alternate; }
    @keyframes loadbar { from { width: 42%; } to { width: 100%; } }
    .error { position: relative; margin: 14px 0 0; padding: 10px 12px; border: 1px solid #ffc9c1; border-radius: 14px; background: #fff1ef; color: #b12c1e; font-weight: 850; }
    .links { position: relative; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; margin-top: 16px; }
    .back { display: inline-flex; color: var(--muted); text-decoration: none; font-weight: 850; }
    .back:hover { color: var(--teal); }
    @media (max-width: 900px) { main { grid-template-columns: 1fr; max-width: 470px; } .showcase { display: none; } form { min-height: 0; } body::before { left: -8vw; top: 3vh; font-size: clamp(1.2rem, 7vw, 2.8rem); line-height: 2.15; } body::after { right: -10vw; bottom: 2vh; font-size: clamp(.95rem, 5vw, 2rem); line-height: 2.3; opacity: .55; } }
    @media (max-width: 520px) { body { padding: 16px; } body::before { content: "注册\\A\\A\\A学习\\A\\A\\A汉语"; } body::after { content: "zhu ce\\A\\A\\Axue xi\\A\\A\\Apin yin"; } form { padding: 78px 20px 22px; border-radius: 22px; } h1 { font-size: 2rem; } }
  </style>
</head>
<body>
  <main>
    <form method="post" action="/register">
      <a class="brand" href="/"><span class="mark">汉</span><span>HSK Studio</span></a>
      <span class="kicker">Create Account</span>
      <h1>สมัครสมาชิก</h1>
      <p>สร้างบัญชีเพื่อเก็บความคืบหน้า สถิติ และผลการเรียนของคุณ</p>
      <input type="hidden" name="return_to" value="${escapeHtml(returnTo)}" />
      <label>ชื่อผู้ใช้<span class="field"><input name="display_name" autocomplete="name" required value="${escapeHtml(displayName)}" placeholder="เช่น Sinaumza" /><span class="field-icon">名</span></span></label>
      <label>อีเมล<span class="field"><input name="email" type="email" autocomplete="email" required value="${escapeHtml(email)}" placeholder="you@example.com" /><span class="field-icon">@</span></span></label>
      <label>รหัสผ่าน<span class="field"><input id="password" name="password" type="password" autocomplete="new-password" minlength="6" required placeholder="อย่างน้อย 6 ตัวอักษร" /><button class="toggle-password" type="button" data-toggle-password="password" aria-label="แสดงหรือซ่อนรหัสผ่าน">ดู</button></span></label>
      <div class="strength" aria-live="polite"><i></i><span>ระดับความแข็งแรงของรหัสผ่าน</span></div>
      <label>ยืนยันรหัสผ่าน<span class="field"><input id="confirm_password" name="confirm_password" type="password" autocomplete="new-password" minlength="6" required placeholder="กรอกรหัสผ่านอีกครั้ง" /><button class="toggle-password" type="button" data-toggle-password="confirm_password" aria-label="แสดงหรือซ่อนรหัสผ่าน">ดู</button></span></label>
      <div class="match" aria-live="polite"></div>
      ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
      <button type="submit"><span class="button-content" aria-live="polite"><span class="button-label">สมัครสมาชิก</span><span class="spinner" aria-hidden="true"></span></span></button>
      <div class="links"><a class="back" href="/login?return_to=${encodeURIComponent(returnTo)}">มีบัญชีแล้ว? เข้าสู่ระบบ</a><a class="back" href="/">กลับหน้าแรก</a></div>
    </form>
    <section class="showcase" aria-hidden="true">
      <span class="orbit"></span>
      <div class="showcase-card"><strong>你</strong><small>ni · คุณ</small></div>
      <div class="showcase-copy"><span>Start Learning</span><h2>เริ่มเส้นทางภาษาจีนของคุณ</h2><p>บัญชีเดียวสำหรับคำศัพท์ บทเรียน ชุดข้อสอบ และสถิติความก้าวหน้า</p><div class="feature-list"><span>บันทึกคำศัพท์ที่จำได้</span><span>ดูสถิติข้อสอบย้อนหลัง</span><span>เชื่อมกับระบบ Admin ได้ทันที</span></div></div>
    </section>
  </main>
  <div class="loading-overlay" role="status" aria-live="polite" aria-hidden="true"><div class="loading-modal"><span class="spinner" aria-hidden="true"></span><p class="loading-text">กำลังสมัครสมาชิก...</p><div class="loading-steps"><i></i><span>กำลังสร้างบัญชีและเตรียมพื้นที่เรียนของคุณ</span></div></div></div>
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
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirm_password");
    const strengthBar = document.querySelector(".strength i");
    const strengthText = document.querySelector(".strength span");
    const matchText = document.querySelector(".match");
    function updatePasswordHints() {
      const value = password?.value || "";
      const score = Math.min(4, Number(value.length >= 6) + Number(/[A-Z]/.test(value)) + Number(/[0-9]/.test(value)) + Number(/[^A-Za-z0-9]/.test(value)));
      const labels = ["ยังไม่พร้อม", "พอใช้", "ดีขึ้น", "ดี", "แข็งแรง"];
      if (strengthBar) strengthBar.style.width = String(score * 25) + "%";
      if (strengthText) strengthText.textContent = "รหัสผ่าน: " + labels[score];
      if (matchText) {
        if (!confirmPassword?.value) matchText.textContent = "";
        else matchText.textContent = confirmPassword.value === value ? "รหัสผ่านตรงกัน" : "รหัสผ่านยังไม่ตรงกัน";
        matchText.style.color = confirmPassword?.value === value ? "var(--teal)" : "var(--red)";
      }
    }
    password?.addEventListener("input", updatePasswordHints);
    confirmPassword?.addEventListener("input", updatePasswordHints);
    document.querySelector("form")?.addEventListener("submit", function () {
      const button = this.querySelector("button[type='submit']");
      const label = this.querySelector(".button-label");
      const loadingOverlay = document.querySelector(".loading-overlay");
      if (!button || !label) return;
      button.disabled = true;
      button.classList.add("is-loading");
      label.textContent = "กำลังสมัครสมาชิก...";
      loadingOverlay?.classList.add("is-visible");
      loadingOverlay?.setAttribute("aria-hidden", "false");
    });
  </script>
</body>
</html>`;
}

function safeReturnTo(value: string | null) { if (!value || !value.startsWith("/") || value.startsWith("//")) return "/"; return value; }
function isValidEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function escapeHtml(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
