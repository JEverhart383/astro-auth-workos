import { getAuthorizationUrl } from "./get-authorization-url.js";
import { cookieName } from "./cookie.js";
import { terminateSession } from "./session.js";
import type { APIContext } from "astro";

async function getSignInUrl() {
  return getAuthorizationUrl({ screenHint: "sign-in" });
}

async function getSignUpUrl() {
  return getAuthorizationUrl({ screenHint: "sign-up" });
}

async function signOut(context: APIContext) {
  context.cookies.delete(cookieName);
  await terminateSession(context);
}

export { getSignInUrl, getSignUpUrl, signOut };
