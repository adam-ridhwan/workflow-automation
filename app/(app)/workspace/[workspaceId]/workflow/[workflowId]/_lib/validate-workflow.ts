import { findNodeSpec, getArgumentValue } from '@/lib/node-specs';

import type { WorkflowEdgeData, WorkflowNodeData } from '@/convex/canvas';
import type { NodeArgument } from '@/lib/node-specs';
import type { Connection, Edge, Node } from '@xyflow/react';

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/** Why a set argument value doesn't fit its spec, or undefined if it does. */
function getArgumentProblem(argument: NodeArgument, value: unknown) {
  if (argument.have_options && argument.options) {
    if (!argument.options.includes(String(value))) {
      return `must be one of: ${argument.options.join(', ')}.`;
    }
    return undefined;
  }

  switch (argument.argument_type) {
    case 'NUMBER':
      // Numeric strings are fine — the field coerces them on blur.
      if (
        typeof value !== 'number' &&
        (typeof value !== 'string' || Number.isNaN(Number(value)))
      ) {
        return 'must be a number.';
      }
      return undefined;

    case 'BOOLEAN':
      if (typeof value !== 'boolean') {
        return 'must be true or false.';
      }
      return undefined;

    case 'MAP':
      if (typeof value !== 'object' || Array.isArray(value)) {
        return 'must be a map of values.';
      }
      return undefined;

    case 'TEXT':
    default:
      if (typeof value !== 'string') {
        return 'must be text.';
      }
      return undefined;
  }
}

/** Whether the node is missing a connection it requires — a mandatory incoming
 * or outgoing port with no edge attached. Nodes without a spec (e.g. the seeded
 * start node) never count as missing one. */
export function hasMissingConnection(
  data: WorkflowNodeData,
  inCount: number,
  outCount: number
): boolean {
  const spec = findNodeSpec(data.node_uid);
  if (!spec) {
    return false;
  }
  const requirement = spec.node_requirement;
  return (
    inCount < requirement.min_in_edges || outCount < requirement.min_out_edges
  );
}

/** Whether the node has any required argument left empty. */
export function hasUnresolvedArguments(data: WorkflowNodeData): boolean {
  const spec = findNodeSpec(data.node_uid);
  if (!spec) {
    return false;
  }
  return spec.node_arguments.some((argument) => {
    if (argument.is_hidden || argument.is_deprecated || !argument.is_required) {
      return false;
    }
    const value = getArgumentValue(data, argument.name);
    return value === undefined || value === null || value === '';
  });
}

/**
 * Whether a prospective edge is allowed by the node specs — enforced live while
 * the user drags a connection (ReactFlow's `isValidConnection`) so invalid edges
 * can never be drawn. Rejects self-loops, duplicates, incompatible node groups,
 * and connections that would exceed the source's `max_out_edges` or the target's
 * `max_in_edges`. Nodes without a spec (e.g. the seeded start node) are
 * unconstrained.
 */
export function canConnect(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge<WorkflowEdgeData>[],
  connection: Connection | Edge
): boolean {
  const { source, target } = connection;
  if (!source || !target || source === target) {
    return false;
  }

  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const sourceNode = nodesById.get(source);
  const targetNode = nodesById.get(target);
  if (!sourceNode || !targetNode) {
    return false;
  }

  const sourceSpec = findNodeSpec(sourceNode.data.node_uid);
  const targetSpec = findNodeSpec(targetNode.data.node_uid);
  if (!sourceSpec || !targetSpec) {
    return true;
  }

  // No duplicate edge between the same two nodes.
  if (edges.some((edge) => edge.source === source && edge.target === target)) {
    return false;
  }

  // Group compatibility must hold in both directions.
  const sourceGroup = sourceSpec.node_info.node_group;
  const targetGroup = targetSpec.node_info.node_group;
  if (
    !targetSpec.node_requirement.valid_inputs.includes(sourceGroup) ||
    !sourceSpec.node_requirement.valid_outputs.includes(targetGroup)
  ) {
    return false;
  }

  // Edge-count caps: adding this edge must not exceed either node's limit.
  const targetInCount = edges.filter((edge) => edge.target === target).length;
  if (targetInCount >= targetSpec.node_requirement.max_in_edges) {
    return false;
  }
  const sourceOutCount = edges.filter((edge) => edge.source === source).length;
  if (sourceOutCount >= sourceSpec.node_requirement.max_out_edges) {
    return false;
  }

  return true;
}

/**
 * Checks the canvas against the node specs: edge counts within each node's
 * requirement, group compatibility along every edge, and required arguments
 * filled in. Returns human-readable problems; an empty list means the
 * workflow is runnable. Nodes without a spec are ignored.
 */
export function validateWorkflow(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge<WorkflowEdgeData>[]
): string[] {
  const errors: string[] = [];

  if (nodes.length === 0) {
    errors.push('Add nodes to the canvas.');
    return errors;
  }

  for (const node of nodes) {
    const spec = findNodeSpec(node.data.node_uid);
    if (!spec) {
      continue;
    }
    const requirement = spec.node_requirement;
    const name = node.data.name;
    const inCount = edges.filter((edge) => edge.target === node.id).length;
    const outCount = edges.filter((edge) => edge.source === node.id).length;

    if (inCount < requirement.min_in_edges) {
      errors.push(
        `${name}: needs at least ${plural(requirement.min_in_edges, 'incoming connection')}.`
      );
    }
    if (inCount > requirement.max_in_edges) {
      errors.push(
        `${name}: allows at most ${plural(requirement.max_in_edges, 'incoming connection')}.`
      );
    }
    if (outCount < requirement.min_out_edges) {
      errors.push(
        `${name}: needs at least ${plural(requirement.min_out_edges, 'outgoing connection')}.`
      );
    }
    if (outCount > requirement.max_out_edges) {
      errors.push(
        `${name}: allows at most ${plural(requirement.max_out_edges, 'outgoing connection')}.`
      );
    }

    for (const argument of spec.node_arguments) {
      if (argument.is_hidden || argument.is_deprecated) {
        continue;
      }
      const value = getArgumentValue(node.data, argument.name);
      const isEmpty = value === undefined || value === null || value === '';
      if (isEmpty) {
        if (argument.is_required) {
          errors.push(`${name}: "${argument.name}" is required.`);
        }
        continue;
      }
      const problem = getArgumentProblem(argument, value);
      if (problem) {
        errors.push(`${name}: "${argument.name}" ${problem}`);
      }
    }
  }

  // Text input labels must be unique so an LLM prompt can target one by name.
  const labelCounts = new Map<string, number>();
  for (const node of nodes) {
    if (
      findNodeSpec(node.data.node_uid)?.node_info.node_type !== 'TEXT_INPUT'
    ) {
      continue;
    }
    const label = String(getArgumentValue(node.data, 'label') ?? '').trim();
    if (label === '') {
      continue;
    }
    labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
  }
  for (const [label, count] of labelCounts) {
    if (count > 1) {
      errors.push(
        `Text input label "${label}" is used ${count} times. Labels must be unique.`
      );
    }
  }

  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  for (const edge of edges) {
    const source = nodesById.get(edge.source);
    const target = nodesById.get(edge.target);
    const sourceSpec = source && findNodeSpec(source.data.node_uid);
    const targetSpec = target && findNodeSpec(target.data.node_uid);
    if (!source || !target || !sourceSpec || !targetSpec) {
      continue;
    }
    const sourceGroup = sourceSpec.node_info.node_group;
    const targetGroup = targetSpec.node_info.node_group;
    if (
      !targetSpec.node_requirement.valid_inputs.includes(sourceGroup) ||
      !sourceSpec.node_requirement.valid_outputs.includes(targetGroup)
    ) {
      errors.push(
        `${source.data.name} → ${target.data.name} is not a valid connection.`
      );
    }
  }

  return errors;
}
