import type { APIRoute } from "astro";
import { Knock } from "@knocklabs/node";
const knockClient = new Knock(import.meta.env.KNOCK_SECRET_API_KEY);

export const POST: APIRoute = async ({ request, locals }) => {
  //@ts-ignore
  const user = locals.session.user;
  const body = await request.json();
  const { data } = body;
  const workflow_run_id = knockClient.workflows.trigger("in-app", {
    actor: user.id,
    recipients: [
      {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      },
    ],
    data: {
      message: data,
    },
  });
  return new Response(
    JSON.stringify({
      message: `Success: triggered workflow run ${workflow_run_id}`,
    })
  );
};
