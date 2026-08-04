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
  /** Present when have_options is true. */
  options?: string[];
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
