import {
  BinaryIcon,
  FileInputIcon,
  FilePlusCornerIcon,
  MonitorIcon,
  SaveIcon,
  SparklesIcon,
  SplitIcon,
  TagsIcon,
  TerminalIcon,
  TextCursorInputIcon,
  WebhookIcon,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

/** Display name, icon and description per node_uid. */
export const NODE_META: Record<
  string,
  { label: string; icon: LucideIcon; description: string }
> = {
  N_001: {
    label: 'Text input',
    icon: TextCursorInputIcon,
    description: 'Provide a text value',
  },
  N_002: {
    label: 'File input',
    icon: FileInputIcon,
    description: 'Read file contents',
  },
  N_003: {
    label: 'Webhook',
    icon: WebhookIcon,
    description: 'Trigger from an HTTP event',
  },
  N_005: {
    label: 'LLM',
    icon: SparklesIcon,
    description: 'Generate text with a model',
  },
  N_006: {
    label: 'Embedding',
    icon: BinaryIcon,
    description: 'Embed text into vectors',
  },
  N_007: {
    label: 'Classifier',
    icon: TagsIcon,
    description: 'Label text with categories',
  },
  N_008: {
    label: 'Display',
    icon: MonitorIcon,
    description: 'Show the result',
  },
  N_009: {
    label: 'Log',
    icon: TerminalIcon,
    description: 'Write to the run log',
  },
  N_010: {
    label: 'Save dataset',
    icon: SaveIcon,
    description: 'Store results as a dataset',
  },
  N_011: {
    label: 'Create file',
    icon: FilePlusCornerIcon,
    description: 'Save the output to a file',
  },
  N_012: {
    label: 'Branch',
    icon: SplitIcon,
    description: 'Route by a condition',
  },
};
