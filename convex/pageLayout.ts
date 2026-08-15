import { Infer, v } from 'convex/values';

/** The kinds of component a page can hold. Input kinds feed a bound workflow
 * input node at run time; OUTPUT renders a bound node's produced text; TEXT and
 * HEADING are static decoration; BUTTON triggers the page's workflow run. */
export const pageComponentTypeValidator = v.union(
  v.literal('TEXT_INPUT'),
  v.literal('FILE_INPUT'),
  v.literal('BUTTON'),
  v.literal('OUTPUT'),
  v.literal('TEXT'),
  v.literal('HEADING')
);

/** One placed component on a page: its kind, free position + size on the grid,
 * free-form props (label/placeholder/text/…), and — for input/output kinds —
 * the id of the workflow node it binds to. */
export const pageComponentValidator = v.object({
  id: v.string(),
  type: pageComponentTypeValidator,
  x: v.number(),
  y: v.number(),
  w: v.number(),
  h: v.number(),
  /** UI-only props: label, placeholder, text, multiline, level, … Kept loose so
   * new component kinds can add props without a schema change. */
  props: v.record(v.string(), v.any()),
  /** For TEXT_INPUT/FILE_INPUT: the workflow input node this feeds. For OUTPUT:
   * the workflow node whose produced text to show. Absent when unbound. */
  bindingNodeId: v.optional(v.string()),
});

export const pageLayoutValidator = v.object({
  components: v.array(pageComponentValidator),
  version: v.number(),
});

export type PageComponentType = Infer<typeof pageComponentTypeValidator>;
export type PageComponentData = Infer<typeof pageComponentValidator>;
export type PageLayoutData = Infer<typeof pageLayoutValidator>;
