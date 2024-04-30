import { jwtVerify, createRemoteJWKSet, decodeJwt } from "jose";
import { sealData, unsealData } from "iron-session";
import { cookieName, cookieOptions } from "./cookie.ts";
import { workos } from "./workos.ts";
import { WORKOS_CLIENT_ID, WORKOS_COOKIE_PASSWORD } from "./env-variables.ts";
import type {
  AccessToken,
  NoUserInfo,
  Session,
  UserInfo,
} from "./interfaces.ts";
import type { APIContext, AstroCookies, MiddlewareNext } from "astro";
import { getAuthorizationUrl } from "./get-authorization-url.ts";

const sessionHeaderName = "x-workos-session";
const middlewareHeaderName = "x-workos-middleware";

const JWKS = createRemoteJWKSet(
  new URL(workos.userManagement.getJwksUrl(WORKOS_CLIENT_ID))
);

async function encryptSession(session: Session) {
  return sealData(session, { password: WORKOS_COOKIE_PASSWORD });
}

async function updateSession(
  context: APIContext,
  next: MiddlewareNext,
  debug: boolean
) {
  const session = await getSessionFromCookie(context.cookies);

  const newRequestHeaders = new Headers(context.request.headers);
  // We store the current request url in a custom header, so we can always have access to it
  // This is because on hard navigations we don't have access to `next-url` but need to get the current
  // `pathname` to be able to return the users where they came from before sign-in
  newRequestHeaders.set("x-url", context.request.url);
  // Record that the request was routed through the middleware so we can check later for DX purposes
  newRequestHeaders.set(middlewareHeaderName, "true");
  newRequestHeaders.delete(sessionHeaderName);

  // If no session, just continue
  if (!session) {
    //we add new request headers and return next
    newRequestHeaders.forEach((value, key) => {
      context.request.headers.set(key, value);
    });

    const response = next;
    return response;
  }

  const hasValidSession = await verifyAccessToken(session.accessToken);

  if (hasValidSession) {
    if (debug) console.log("Session is valid");
    // set the x-workos-session header according to the current cookie value
    newRequestHeaders.set(
      sessionHeaderName,
      context.cookies.get(cookieName)!.value
    );

    //we add new request headers and return next
    newRequestHeaders.forEach((value, key) => {
      context.request.headers.set(key, value);
    });
    //@ts-ignore
    context.locals.session = session;
    const response = next;
    return response;
  }

  try {
    if (debug)
      console.log("Session invalid. Attempting refresh", session.refreshToken);

    // If the session is invalid (i.e. the access token has expired) attempt to re-authenticate with the refresh token
    const { accessToken, refreshToken } =
      await workos.userManagement.authenticateWithRefreshToken({
        clientId: WORKOS_CLIENT_ID,
        refreshToken: session.refreshToken,
      });

    if (debug) console.log("Refresh successful:", refreshToken);

    // Encrypt session with new access and refresh tokens
    const encryptedSession = await encryptSession({
      accessToken,
      refreshToken,
      user: session.user,
      impersonator: session.impersonator,
    });

    newRequestHeaders.set(sessionHeaderName, encryptedSession);

    //we add new request headers and return next
    newRequestHeaders.forEach((value, key) => {
      context.request.headers.set(key, value);
    });
    context.cookies.set(cookieName, encryptedSession, cookieOptions);
    //@ts-ignore
    context.locals.session = session;
    const response = next;
    return response;
  } catch (e) {
    console.warn("Failed to refresh", e);
    newRequestHeaders.forEach((value, key) => {
      context.request.headers.set(key, value);
    });
    context.cookies.delete(cookieName);
    const response = await next;
    return response;
  }
}

async function getUser({
  ensureSignedIn,
  context,
}: {
  ensureSignedIn: boolean;
  context: APIContext;
}): Promise<UserInfo | NoUserInfo> {
  const hasMiddleware = Boolean(
    context.request.headers.get(middlewareHeaderName)
  );
  const path = new URL(context.request.url).pathname;
  if (!hasMiddleware && path !== "/auth/signout") {
    throw new Error(
      "You are calling `getUser` on a path that isn’t covered by the AuthKit middleware. Make sure it is running on all paths you are calling `getUser` from by updating your middleware config in `middleware.(js|ts)`."
    );
  }

  const session = await getSessionFromHeader(context.request.headers);
  if (!session) {
    //This will need to be done elsewhere I think
    if (ensureSignedIn) {
      console.log("should redirect");
      const url = context.request.headers.get("x-url");
      const returnPathname = url ? new URL(url).pathname : undefined;
      await context.redirect(await getAuthorizationUrl({ returnPathname }));
    }
    return { user: null };
  }

  const {
    sid: sessionId,
    org_id: organizationId,
    role,
  } = decodeJwt<AccessToken>(session.accessToken);

  return {
    sessionId,
    user: session.user,
    organizationId,
    role,
    impersonator: session.impersonator,
  };
}

async function terminateSession(context: APIContext) {
  const { sessionId } = await getUser({
    ensureSignedIn: false,
    context,
  });
  if (sessionId) {
    return context.redirect(workos.userManagement.getLogoutUrl({ sessionId }));
  }
  return context.redirect("/");
}

async function verifyAccessToken(accessToken: string) {
  try {
    await jwtVerify(accessToken, JWKS);
    return true;
  } catch (e) {
    console.warn("Failed to verify session:", e);
    return false;
  }
}

async function getSessionFromCookie(cookies: AstroCookies) {
  const cookie = cookies.get(cookieName);
  if (cookie) {
    return unsealData<Session>(cookie.value, {
      password: WORKOS_COOKIE_PASSWORD,
    });
  }
}

async function getSessionFromHeader(
  headers: Headers
): Promise<Session | undefined> {
  const authHeader = headers.get(sessionHeaderName);
  if (!authHeader) return;

  return unsealData<Session>(authHeader, { password: WORKOS_COOKIE_PASSWORD });
}

// export { encryptSession, updateSession, getUser, terminateSession };
export { encryptSession, updateSession, getUser, terminateSession };
