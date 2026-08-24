import { getDevAuthCookieNames } from "../../../chatgpt-auth";

export async function GET(request: Request) {
  if (!isLocalRequest(request)) {
    return Response.json({ error: "Dev auth is only available on localhost" }, { status: 404 });
  }

  const returnTo = safeReturnTo(new URL(request.url).searchParams.get("return_to"));
  const headers = new Headers({ Location: returnTo });
  const cookies = getDevAuthCookieNames();

  headers.append(
    "Set-Cookie",
    `${cookies.userId}=local-dev-user; Path=/; SameSite=Lax; HttpOnly`,
  );
  headers.append(
    "Set-Cookie",
    `${cookies.email}=local@example.com; Path=/; SameSite=Lax; HttpOnly`,
  );
  headers.append(
    "Set-Cookie",
    `${cookies.displayName}=Local%20learner; Path=/; SameSite=Lax; HttpOnly`,
  );

  return new Response(null, { status: 302, headers });
}

function isLocalRequest(request: Request) {
  const host = request.headers.get("host") ?? "";
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
