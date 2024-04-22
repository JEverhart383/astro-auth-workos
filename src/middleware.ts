import { defineMiddleware } from "astro:middleware";
import { updateSession } from "./authkit-astro/session";

export const onRequest = defineMiddleware(async (context, next) => {
  //we exclude other our auth callback and any other public routes
  const publicRoutes = ["/auth/callback"];

  if (publicRoutes.includes(context.url.pathname)) {
    return next();
  }
  const session = await updateSession(context, next, true);
  console.log("middleware is running");
  const response = next();

  // return a Response or the result of calling `next()`
  return response;
});
