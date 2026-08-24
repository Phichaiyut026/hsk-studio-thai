export async function GET(request: Request) {
  const returnTo = safeReturnTo(new URL(request.url).searchParams.get("return_to"));
  return Response.redirect(new URL(`/logout?return_to=${encodeURIComponent(returnTo)}`, request.url), 302);
}

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
