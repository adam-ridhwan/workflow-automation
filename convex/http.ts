import { httpRouter } from 'convex/server';

import { internal } from './_generated/api';
import { httpAction } from './_generated/server';
import { auth } from './auth';

const http = httpRouter();

auth.addHttpRoutes(http);

// Cap the stored payload so a giant POST body can't blow up a run.
const MAX_PAYLOAD_CHARS = 100_000;

/** Inbound webhook: `POST /webhooks/<token>` triggers the matching workflow,
 * feeding the request body to its WEBHOOK nodes. The token is the credential. */
http.route({
  pathPrefix: '/webhooks/',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const token = decodeURIComponent(
      new URL(request.url).pathname.replace(/^\/webhooks\//, '')
    );
    if (token === '') {
      return new Response('Not found', { status: 404 });
    }

    const ref = await ctx.runQuery(internal.workflows.byWebhookToken, {
      token,
    });
    if (ref === null) {
      return new Response('Not found', { status: 404 });
    }

    const body = await request.text();
    const payload =
      body.length > MAX_PAYLOAD_CHARS ? body.slice(0, MAX_PAYLOAD_CHARS) : body;

    // Run the canvas live (animated badges) like a normal run — no run-history
    // entry, so external triggers don't pile up in the Runs tab.
    await ctx.scheduler.runAfter(0, internal.runWorkflow.executeOnCanvas, {
      workflowId: ref.workflowId,
      canvas: ref.canvas,
      webhookPayload: payload,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
});

export default http;
