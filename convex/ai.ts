'use node';

import Anthropic from '@anthropic-ai/sdk';
import { v } from 'convex/values';

import { action } from './_generated/server';

export const runLlm = action({
  args: {
    model: v.string(),
    prompt: v.string(),
    system: v.optional(v.string()),
    maxTokens: v.number(),
  },
  returns: v.string(),
  handler: async (_ctx, args) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Run: npx convex env set ANTHROPIC_API_KEY <key>'
      );
    }

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: args.model,
      max_tokens: args.maxTokens,
      system: args.system,
      messages: [{ role: 'user', content: args.prompt }],
    });

    return message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');
  },
});
