import type { APIRoute } from "astro";
import { Knock } from "@knocklabs/node";
const knockClient = new Knock(import.meta.env.KNOCK_SECRET_API_KEY);

export const POST: APIRoute = async ({ request, locals }) => {
  //@ts-ignore
  console.log(locals.session.user);
  const body = await request.json();
  const { data } = body;
  console.log(data);
  return new Response(JSON.stringify({ message: "success" }));
};
