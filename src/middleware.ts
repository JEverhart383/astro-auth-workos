import { defineMiddleware } from "astro:middleware";
import { updateSession } from "./authkit-astro/session";

export const onRequest = defineMiddleware(async (context, next) => {
  //we exclude other our auth callback and any other public routes
  const publicRoutes = ["/auth/callback"];
  if (publicRoutes.includes(context.url.pathname)) {
    return next();
  }
  console.log("middleware is running");
  const session = await updateSession(context, next, true);
  const response = await next();

  // return a Response or the result of calling `next()`
  return response;
});
