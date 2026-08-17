import { CircleArrowRightIcon, CpuIcon, SendIcon } from 'lucide-react';

import type { NodeGroup } from '@/lib/node-specs';
import type { LucideIcon } from 'lucide-react';

/** Label and icon per node group. */
export const NODE_GROUP_META: Record<
  NodeGroup,
  { label: string; icon: LucideIcon }
> = {
  INPUT: { label: 'Input', icon: CircleArrowRightIcon },
  MODEL: { label: 'Model', icon: CpuIcon },
  OUTPUT: { label: 'Output', icon: SendIcon },
};
