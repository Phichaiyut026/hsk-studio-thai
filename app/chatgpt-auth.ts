import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export type ChatGPTUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

const USER_ID_HEADER = "oai-authenticated-user-id";
const USER_EMAIL_HEADER = "oai-authenticated-user-email";
const USER_FULL_NAME_HEADER = "oai-authenticated-user-full-name";
const USER_FULL_NAME_ENCODING_HEADER =
  "oai-authenticated-user-full-name-encoding";
const PERCENT_ENCODED_UTF8 = "percent-encoded-utf-8";
const SIGN_IN_PATH = "/login";
const SIGN_OUT_PATH = "/logout";
const CALLBACK_PATH = "/callback";
const DEV_USER_ID_COOKIE = "hsk-dev-user-id";
const DEV_USER_EMAIL_COOKIE = "hsk-dev-user-email";
const DEV_USER_DISPLAY_NAME_COOKIE = "hsk-dev-display-name";

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const requestHeaders = await headers();
  const userId = requestHeaders.get(USER_ID_HEADER);
  const email = requestHeaders.get(USER_EMAIL_HEADER);
  if (!userId || !email) {
    const cookieStore = await cookies();
    const devUserId = cookieStore.get(DEV_USER_ID_COOKIE)?.value;
    const devEmail = cookieStore.get(DEV_USER_EMAIL_COOKIE)?.value;
    const devDisplayName = cookieStore.get(DEV_USER_DISPLAY_NAME_COOKIE)?.value;
    if (!devUserId || !devEmail) return null;
    const displayName =
      safeDecodeURIComponent(devDisplayName ?? "") ??
      (isLocalRequest(requestHeaders) ? "Local learner" : "HSK learner");

    return {
      userId: devUserId,
      displayName,
      email: devEmail,
      fullName: displayName,
    };
  }

  const encodedFullName = requestHeaders.get(USER_FULL_NAME_HEADER);
  const fullName =
    encodedFullName &&
    requestHeaders.get(USER_FULL_NAME_ENCODING_HEADER) === PERCENT_ENCODED_UTF8
      ? safeDecodeURIComponent(encodedFullName)
      : null;

  return {
    userId,
    displayName: fullName ?? email,
    email,
    fullName,
  };
}

export async function requireChatGPTUser(
  returnTo: string,
): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;

  redirect(chatGPTSignInPath(returnTo));
}

export function chatGPTSignInPath(returnTo: string): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function chatGPTSignOutPath(returnTo = "/"): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${SIGN_OUT_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export async function getAuthPaths(returnTo = "/") {
  const requestHeaders = await headers();
  const safeReturnTo = safeRelativeReturnPath(returnTo);

  if (isLocalRequest(requestHeaders)) {
    return {
      signIn: `/api/dev-auth/signin?return_to=${encodeURIComponent(safeReturnTo)}`,
      signOut: `/api/dev-auth/signout?return_to=${encodeURIComponent(safeReturnTo)}`,
    };
  }

  return {
    signIn: chatGPTSignInPath(safeReturnTo),
    signOut: chatGPTSignOutPath(safeReturnTo),
  };
}

export function getDevAuthCookieNames() {
  return {
    userId: DEV_USER_ID_COOKIE,
    email: DEV_USER_EMAIL_COOKIE,
    displayName: DEV_USER_DISPLAY_NAME_COOKIE,
  };
}

function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";

  let url: URL;
  try {
    url = new URL(value, "https://app.local");
  } catch {
    return "/";
  }
  if (url.origin !== "https://app.local") return "/";
  if (isReservedAuthPath(url.pathname)) return "/";

  return `${url.pathname}${url.search}${url.hash}`;
}

function isReservedAuthPath(pathname: string): boolean {
  return (
    pathname === SIGN_IN_PATH ||
    pathname === SIGN_OUT_PATH ||
    pathname === CALLBACK_PATH
  );
}

function isLocalRequest(requestHeaders: Headers) {
  const host = requestHeaders.get("host") ?? "";
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
