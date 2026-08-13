// Node spec registry shared by the canvas UI and the backend executor.

import type { WorkflowNodeData } from '../convex/canvas';

export type ArgumentType = 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'MAP';

export type NodeGroup = 'INPUT' | 'MODEL' | 'OUTPUT';

export interface NodeArgument {
  argument_type: ArgumentType;
  children: Record<string, NodeArgument>;
  default_value?: unknown;
  have_options: boolean;
  have_sub_arguments: boolean;
  is_deprecated: boolean;
  is_hidden: boolean;
  is_list: boolean;
  is_required: boolean;
  name: string;
  /** Overrides the field label shown in the UI (which otherwise derives from
   * `name`). Doesn't change the stored argument key. */
  label?: string;
  /** Present when have_options is true. */
  options?: string[];
  /** When set, the field's options come from a live source rather than the
   * static `options` list — e.g. `'files'` renders a picker of the workspace's
   * uploaded files and stores the selected file's id. */
  select_source?: 'files';
  /** Renders a bespoke read-only control instead of an input — e.g.
   * `'webhook_url'` shows the workflow's inbound webhook URL with copy/enable
   * actions. Such fields have no stored value. */
  display?: 'webhook_url';
  /** Present when have_sub_arguments is true: [flagValue, requiredArgNames][]. */
  sub_argument_requirements?: Array<[boolean, string[]]>;
}

export interface NodeInfo {
  node_group: NodeGroup;
  node_type: string;
  node_uid: `N_${string}`;
}

export interface NodeRequirement {
  max_in_edges: number;
  max_out_edges: number;
  min_in_edges: number;
  min_out_edges: number;
  valid_inputs: NodeGroup[];
  valid_outputs: NodeGroup[];
}

export interface NodeSpec {
  in_edge_arguments: NodeArgument[];
  node_arguments: NodeArgument[];
  node_info: NodeInfo;
  node_requirement: NodeRequirement;
  out_edge_arguments: NodeArgument[];
}

/** group -> node_type -> spec */
export type NodeSpecRegistry = Record<string, Record<string, NodeSpec>>;

export const NODE_SPECS = {
  INPUT: {
    TEXT_INPUT: {
      in_edge_arguments: [],
      node_arguments: [
        {
          argument_type: 'TEXT',
          children: {},
          default_value: '',
          have_options: false,
          have_sub_arguments: false,
          is_deprecated: false,
          is_hidden: false,
          is_list: false,
          is_required: false,
          name: 'label',
        },
        {
          argument_type: 'TEXT',
          children: {},
          default_value: 'Hello, world',
          have_options: false,
          have_sub_arguments: false,
          is_deprecated: false,
          is_hidden: false,
          is_list: false,
          is_required: true,
          name: 'text_input',
          label: 'Value',
        },
      ],
      node_info: {
        node_group: 'INPUT',
        node_type: 'TEXT_INPUT',
        node_uid: 'N_001',
      },
      node_requirement: {
        max_in_edges: 0,
        max_out_edges: 100,
        min_in_edges: 0,
        min_out_edges: 1,
        valid_inputs: [],
        valid_outputs: ['MODEL', 'OUTPUT'],
      },
      out_edge_arguments: [],
    },
    FILE_INPUT: {
      in_edge_arguments: [],
      node_arguments: [
        {
          argument_type: 'TEXT',
          children: {},
          default_value: 'csv',
          have_options: true,
          have_sub_arguments: false,
          is_deprecated: false,
          is_hidden: false,
          is_list: false,
          is_required: false,
          name: 'format',
          options: ['csv', 'json', 'txt'],
        },
        {
          argument_type: 'TEXT',
          children: {},
          have_options: false,
          have_sub_arguments: false,
          is_deprecated: false,
          is_hidden: false,
          is_list: false,
          is_required: false,
          name: 'file',
          select_source: 'files',
        },
      ],
      node_info: {
        node_group: 'INPUT',
        node_type: 'FILE_INPUT',
        node_uid: 'N_002',
      },
      node_requirement: {
        max_in_edges: 0,
        max_out_edges: 100,
        min_in_edges: 0,
        min_out_edges: 1,
        valid_inputs: [],
        valid_outputs: ['MODEL', 'OUTPUT'],
      },
      out_edge_arguments: [],
    },
    WEBHOOK: {
      in_edge_arguments: [],
      node_arguments: [
        {
          argument_type: 'TEXT',
          children: {},
          display: 'webhook_url',
          have_options: false,
          have_sub_arguments: false,
          is_deprecated: false,
          is_hidden: false,
          is_list: false,
          is_required: false,
          name: 'webhook_url',
        },
        {
          argument_type: 'TEXT',
          children: {},
          default_value: '{\n  "event": "signup",\n  "user": "ada"\n}',
          have_options: false,
          have_sub_arguments: false,
          is_deprecated: false,
          is_hidden: false,
          is_list: false,
          is_required: false,
          name: 'payload',
        },
      ],
      node_info: {
        node_group: 'INPUT',
        node_type: 'WEBHOOK',
        node_uid: 'N_003',
      },
      node_requirement: {
        max_in_edges: 0,
        max_out_edges: 100,
        min_in_edges: 0,
        min_out_edges: 1,
        valid_inputs: [],
        valid_outputs: ['MODEL', 'OUTPUT'],
      },
      out_edge_arguments: [],
    },
  },
  MODEL: {
    LLM: {
      in_edge_arguments: [],
      node_arguments: [
        {
          argument_type: 'TEXT',
          children: {
            anthropic: {
              argument_type: 'TEXT',
              children: {},
              default_value: 'claude-sonnet-5',
              have_options: true,
              have_sub_arguments: false,
              is_deprecated: false,
              is_hidden: false,
              is_list: false,
              is_required: false,
              name: 'model',
              options: [
                'claude-sonnet-5',
                'claude-haiku-4-5-20251001',
                'claude-opus-4-8',
                'claude-fable-5',
              ],
            },
            openai: {
              argument_type: 'TEXT',
              children: {},
              default_value: 'gpt-4o',
              have_options: true,
              have_sub_arguments: false,
              is_deprecated: false,
              is_hidden: false,
              is_list: false,
              is_required: false,
              name: 'model',
              options: ['gpt-4o', 'gpt-4o-mini', 'o1'],
            },
            deepseek: {
              argument_type: 'TEXT',
              children: {},
              default_value: 'deepseek-chat',
              have_options: true,
              have_sub_arguments: false,
              is_deprecated: false,
              is_hidden: false,
              is_list: false,
              is_required: false,
              name: 'model',
              options: ['deepseek-chat', 'deepseek-reasoner'],
            },
          },
          default_value: 'anthropic',
          have_options: true,
          have_sub_arguments: true,
          is_deprecated: false,
          is_hidden: false,
          is_list: false,
          is_required: true,
          name: 'provider',
          options: ['anthropic', 'openai', 'deepseek'],
        },
        {
          argument_type: 'TEXT',
          children: {},
          default_value: 'Reply with one word.\n{{text_input}}',
          have_options: false,
          have_sub_arguments: false,
          is_deprecated: false,
          is_hidden: false,
          is_list: false,
          is_required: true,
          name: 'prompt',
        },
        {
          argument_type: 'TEXT',
          children: {},
          default_value: '',
          have_options: false,
          have_sub_arguments: false,
          is_deprecated: false,
          is_hidden: false,
          is_list: false,
          is_required: false,
          name: 'system',
        },
        {
          argument_type: 'NUMBER',
          children: {},
          default_value: 1024,
          have_options: false,
          have_sub_arguments: false,
          is_deprecated: false,
          is_hidden: false,
          is_list: false,
          is_required: false,
          name: 'max_tokens',
        },
      ],
      node_info: {
        node_group: 'MODEL',
        node_type: 'LLM',
        node_uid: 'N_005',
      },
      node_requirement: {
        max_in_edges: 100,
        max_out_edges: 100,
        min_in_edges: 1,
        min_out_edges: 1,
        valid_inputs: ['INPUT', 'MODEL'],
        valid_outputs: ['MODEL', 'OUTPUT'],
      },
      out_edge_arguments: [],
    },
  },
  OUTPUT: {
    FILE_OUTPUT: {
      in_edge_arguments: [],
      node_arguments: [
        {
          argument_type: 'TEXT',
          children: {},
          default_value: 'output.txt',
          have_options: false,
          have_sub_arguments: false,
          is_deprecated: false,
          is_hidden: false,
          is_list: false,
          is_required: true,
          name: 'filename',
          label: 'File name',
        },
      ],
      node_info: {
        node_group: 'OUTPUT',
        node_type: 'FILE_OUTPUT',
        node_uid: 'N_011',
      },
      node_requirement: {
        max_in_edges: 100,
        max_out_edges: 0,
        min_in_edges: 1,
        min_out_edges: 0,
        valid_inputs: ['INPUT', 'MODEL'],
        valid_outputs: [],
      },
      out_edge_arguments: [],
    },
    DISPLAY: {
      in_edge_arguments: [],
      node_arguments: [],
      node_info: {
        node_group: 'OUTPUT',
        node_type: 'DISPLAY',
        node_uid: 'N_008',
      },
      node_requirement: {
        max_in_edges: 100,
        max_out_edges: 0,
        min_in_edges: 1,
        min_out_edges: 0,
        valid_inputs: ['INPUT', 'MODEL'],
        valid_outputs: [],
      },
      out_edge_arguments: [],
    },
    LOG: {
      in_edge_arguments: [],
      node_arguments: [],
      node_info: {
        node_group: 'OUTPUT',
        node_type: 'LOG',
        node_uid: 'N_009',
      },
      node_requirement: {
        max_in_edges: 100,
        max_out_edges: 0,
        min_in_edges: 1,
        min_out_edges: 0,
        valid_inputs: ['INPUT', 'MODEL'],
        valid_outputs: [],
      },
      out_edge_arguments: [],
    },
  },
} satisfies NodeSpecRegistry;

const specsByUid = new Map<string, NodeSpec>(
  Object.values(NODE_SPECS)
    .flatMap((group) => Object.values(group))
    .map((spec) => [spec.node_info.node_uid, spec])
);

/** Look up a node spec by its `node_uid`; undefined for unknown uids (e.g.
 * the seeded start node). */
export function findNodeSpec(nodeUid: string): NodeSpec | undefined {
  return specsByUid.get(nodeUid);
}

/** Finds an argument's spec default by name, descending into sub-arguments
 * along the currently-selected parent value (so `model`'s default matches the
 * chosen `provider`). */
function findArgumentDefault(
  data: WorkflowNodeData,
  args: NodeArgument[] | undefined,
  name: string
): unknown {
  for (const argument of args ?? []) {
    if (argument.name === name) {
      return argument.default_value;
    }
    if (argument.have_sub_arguments) {
      const parentValue = String(
        data.arguments[argument.name] ?? argument.default_value ?? ''
      );
      const child = argument.children[parentValue];
      if (child) {
        const found = findArgumentDefault(data, [child], name);
        if (found !== undefined) {
          return found;
        }
      }
    }
  }
  return undefined;
}

/** A node's stored argument value, falling back to the spec default when the
 * node has never set one. A stored empty string counts as a value — matching
 * what the argument fields display — so clearing a field doesn't silently
 * revert to the default. Resolves sub-argument defaults (e.g. `model`) through
 * the selected parent value. */
export function getArgumentValue(data: WorkflowNodeData, name: string) {
  return (
    data.arguments[name] ??
    findArgumentDefault(data, findNodeSpec(data.node_uid)?.node_arguments, name)
  );
}
