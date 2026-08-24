import { getDevAuthCookieNames } from "../chatgpt-auth";

export async function GET(request: Request) {
  const returnTo = safeReturnTo(new URL(request.url).searchParams.get("return_to"));
  const headers = new Headers({ Location: returnTo });
  const cookies = getDevAuthCookieNames();
  const secure = request.url.startsWith("https://") ? "; Secure" : "";

  headers.append("Set-Cookie", `${cookies.userId}=; Path=/; SameSite=Lax; HttpOnly; Max-Age=0${secure}`);
  headers.append("Set-Cookie", `${cookies.email}=; Path=/; SameSite=Lax; HttpOnly; Max-Age=0${secure}`);
  headers.append("Set-Cookie", `${cookies.displayName}=; Path=/; SameSite=Lax; HttpOnly; Max-Age=0${secure}`);

  return new Response(null, { status: 302, headers });
}

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
