import { Infer, v } from 'convex/values';

export const workflowAnnotationValidator = v.object({
  text: v.string(),
  size: v.union(v.literal('sm'), v.literal('md'), v.literal('lg')),
  bold: v.boolean(),
  italic: v.boolean(),
  align: v.union(v.literal('left'), v.literal('center'), v.literal('right')),
});

export const workflowNodeValidator = v.object({
  node_id: v.string(),
  node_uid: v.string(),
  name: v.string(),
  arguments: v.record(v.string(), v.any()),
  parents: v.array(v.string()),
  children: v.array(v.string()),
  position: v.optional(v.object({ x: v.number(), y: v.number() })),
  annotation: v.optional(workflowAnnotationValidator),
});

export const workflowEdgeValidator = v.object({
  source: v.string(),
  target: v.string(),
  arguments: v.record(v.string(), v.any()),
});

export const workflowCanvasValidator = v.object({
  nodes: v.record(v.string(), workflowNodeValidator),
  edges: v.array(workflowEdgeValidator),
  version: v.number(),
});

export type WorkflowNodeData = Infer<typeof workflowNodeValidator>;
export type WorkflowAnnotation = Infer<typeof workflowAnnotationValidator>;
export type WorkflowEdgeData = Infer<typeof workflowEdgeValidator>;
export type WorkflowCanvasData = Infer<typeof workflowCanvasValidator>;
