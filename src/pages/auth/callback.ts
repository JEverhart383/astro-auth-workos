import { workos } from "../../authkit-astro/workos.ts";
import { WORKOS_CLIENT_ID } from "../../authkit-astro/env-variables.ts";
import { encryptSession } from "../../authkit-astro/session.ts";
import { cookieName, cookieOptions } from "../../authkit-astro/cookie.ts";
import type { APIContext } from "astro";

export async function GET({
  params,
  request,
  redirect,
  cookies,
  url,
}: APIContext) {
  const searchParams = url.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const returnPathname = state ? JSON.parse(atob(state)).returnPathname : null;

  if (code) {
    const { accessToken, refreshToken, user, impersonator } =
      await workos.userManagement.authenticateWithCode({
        clientId: WORKOS_CLIENT_ID,
        code,
      });
    const session = await encryptSession({
      accessToken,
      refreshToken,
      user,
      impersonator,
    });
    cookies.set(cookieName, session, cookieOptions);
    return redirect("/account", 302);
  }

  return new Response("test");
}
