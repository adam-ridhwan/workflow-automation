import type { WorkflowCanvasData } from '@/convex/canvas';

/** A pre-built, ready-to-run workflow. `canvas` is a valid
 * `workflowCanvasValidator` object — it passes `validateWorkflow` and runs on
 * Anthropic out of the box. Drop `canvas` into a workflow row (like the
 * `duplicate` mutation does) to instantiate a template. */
export type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  canvas: WorkflowCanvasData;
};

// Node type uids (see lib/node-specs.ts).
const TEXT_INPUT = 'N_001';
const FILE_INPUT = 'N_002';
const LLM = 'N_005';
const DISPLAY = 'N_008';

/** Anthropic LLM node arguments. NOTE: the runtime injects upstream output at
 * the literal `{{text_input}}` token in `prompt` — not `{{input}}`. */
function llmArguments(options: {
  prompt: string;
  system?: string;
  model?: string;
  maxTokens?: number;
}) {
  return {
    provider: 'anthropic',
    model: options.model ?? 'claude-sonnet-5',
    prompt: options.prompt,
    system: options.system ?? '',
    max_tokens: options.maxTokens ?? 1024,
  };
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'summarize',
    name: 'Summarize text',
    description: 'Condense any text into a few sentences.',
    canvas: {
      version: 1,
      nodes: {
        input: {
          node_id: 'input',
          node_uid: TEXT_INPUT,
          name: 'Text',
          arguments: {
            text_input:
              'Paste the text you want summarized here. It can be an article, a transcript, or any long passage.',
          },
          parents: [],
          children: [],
          position: { x: 0, y: 0 },
        },
        summarize: {
          node_id: 'summarize',
          node_uid: LLM,
          name: 'Summarize',
          arguments: llmArguments({
            system: 'You are a concise writing assistant.',
            prompt:
              'Summarize the following text in 2-3 sentences. Keep it clear and neutral.\n\n{{text_input}}',
          }),
          parents: [],
          children: [],
          position: { x: 340, y: 0 },
        },
        output: {
          node_id: 'output',
          node_uid: DISPLAY,
          name: 'Summary',
          arguments: {},
          parents: [],
          children: [],
          position: { x: 680, y: 0 },
        },
      },
      edges: [
        { source: 'input', target: 'summarize', arguments: {} },
        { source: 'summarize', target: 'output', arguments: {} },
      ],
    },
  },
  {
    id: 'translate',
    name: 'Translate to French',
    description: 'Translate any input text into French.',
    canvas: {
      version: 1,
      nodes: {
        input: {
          node_id: 'input',
          node_uid: TEXT_INPUT,
          name: 'Text',
          arguments: { text_input: 'The weather is lovely today.' },
          parents: [],
          children: [],
          position: { x: 0, y: 0 },
        },
        translate: {
          node_id: 'translate',
          node_uid: LLM,
          name: 'Translate',
          arguments: llmArguments({
            system: 'You are a professional translator.',
            prompt:
              'Translate the following text into French. Return only the translation, with no notes.\n\n{{text_input}}',
          }),
          parents: [],
          children: [],
          position: { x: 340, y: 0 },
        },
        output: {
          node_id: 'output',
          node_uid: DISPLAY,
          name: 'Translation',
          arguments: {},
          parents: [],
          children: [],
          position: { x: 680, y: 0 },
        },
      },
      edges: [
        { source: 'input', target: 'translate', arguments: {} },
        { source: 'translate', target: 'output', arguments: {} },
      ],
    },
  },
  {
    id: 'sentiment',
    name: 'Sentiment analysis',
    description: 'Classify text as Positive, Negative, or Neutral.',
    canvas: {
      version: 1,
      nodes: {
        input: {
          node_id: 'input',
          node_uid: TEXT_INPUT,
          name: 'Text',
          arguments: {
            text_input:
              'Honestly the support team went above and beyond — best experience I have had all year.',
          },
          parents: [],
          children: [],
          position: { x: 0, y: 0 },
        },
        classify: {
          node_id: 'classify',
          node_uid: LLM,
          name: 'Classify',
          arguments: llmArguments({
            system: 'You are a precise text classifier.',
            maxTokens: 16,
            prompt:
              'Classify the sentiment of the following text as exactly one word: Positive, Negative, or Neutral.\n\n{{text_input}}',
          }),
          parents: [],
          children: [],
          position: { x: 340, y: 0 },
        },
        output: {
          node_id: 'output',
          node_uid: DISPLAY,
          name: 'Sentiment',
          arguments: {},
          parents: [],
          children: [],
          position: { x: 680, y: 0 },
        },
      },
      edges: [
        { source: 'input', target: 'classify', arguments: {} },
        { source: 'classify', target: 'output', arguments: {} },
      ],
    },
  },
  {
    id: 'draft-and-refine',
    name: 'Draft & refine',
    description: 'Draft a response, then a second model polishes it.',
    canvas: {
      version: 1,
      nodes: {
        input: {
          node_id: 'input',
          node_uid: TEXT_INPUT,
          name: 'Request',
          arguments: {
            text_input:
              'Write a friendly email declining a meeting invitation for next Tuesday.',
          },
          parents: [],
          children: [],
          position: { x: 0, y: 0 },
        },
        draft: {
          node_id: 'draft',
          node_uid: LLM,
          name: 'Draft',
          arguments: llmArguments({
            model: 'claude-haiku-4-5-20251001',
            system: 'You write quick first drafts.',
            prompt: 'Write a first draft for this request:\n\n{{text_input}}',
          }),
          parents: [],
          children: [],
          position: { x: 340, y: 0 },
        },
        refine: {
          node_id: 'refine',
          node_uid: LLM,
          name: 'Refine',
          arguments: llmArguments({
            model: 'claude-sonnet-5',
            system: 'You are a meticulous editor.',
            prompt:
              'Improve the following draft: fix grammar, tighten the wording, and make the tone warm and professional. Return only the revised version.\n\n{{text_input}}',
          }),
          parents: [],
          children: [],
          position: { x: 680, y: 0 },
        },
        output: {
          node_id: 'output',
          node_uid: DISPLAY,
          name: 'Final',
          arguments: {},
          parents: [],
          children: [],
          position: { x: 1020, y: 0 },
        },
      },
      edges: [
        { source: 'input', target: 'draft', arguments: {} },
        { source: 'draft', target: 'refine', arguments: {} },
        { source: 'refine', target: 'output', arguments: {} },
      ],
    },
  },
  {
    id: 'csv-to-json',
    name: 'CSV to JSON',
    description: 'Turn CSV rows into a clean JSON array.',
    canvas: {
      version: 1,
      nodes: {
        input: {
          node_id: 'input',
          node_uid: FILE_INPUT,
          name: 'CSV',
          arguments: {
            format: 'csv',
            content: 'name,score\nAda,90\nAlan,77\nGrace,85',
          },
          parents: [],
          children: [],
          position: { x: 0, y: 0 },
        },
        extract: {
          node_id: 'extract',
          node_uid: LLM,
          name: 'Convert',
          arguments: llmArguments({
            system: 'You convert data between formats exactly and safely.',
            prompt:
              'Convert the following CSV into a JSON array of objects, using the header row as keys. Return only valid JSON.\n\n{{text_input}}',
          }),
          parents: [],
          children: [],
          position: { x: 340, y: 0 },
        },
        output: {
          node_id: 'output',
          node_uid: DISPLAY,
          name: 'JSON',
          arguments: {},
          parents: [],
          children: [],
          position: { x: 680, y: 0 },
        },
      },
      edges: [
        { source: 'input', target: 'extract', arguments: {} },
        { source: 'extract', target: 'output', arguments: {} },
      ],
    },
  },
];
