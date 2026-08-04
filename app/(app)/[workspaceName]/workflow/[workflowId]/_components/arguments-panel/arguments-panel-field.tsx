'use client';

import { Label } from '@/components/ui/label';

import { BooleanField } from './boolean/default/boolean-field';
import { NumberField } from './number/default/number-field';
import { SelectField } from './select/default/select-field';
import { TextField } from './text/default/text-field';

import type { NodeArgument } from '../../_types';
import type { WorkflowNodeData } from '@/convex/canvas';
import type { Node } from '@xyflow/react';

/** "max_tokens" -> "Max tokens" */
function formatLabel(name: string) {
  const spaced = name.replaceAll('_', ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

type ArgumentsPanelFieldProps = {
  node: Node<WorkflowNodeData>;
  argument: NodeArgument;
};

export function ArgumentsPanelField({
  node,
  argument,
}: ArgumentsPanelFieldProps) {
  const fieldId = `arg-${node.id}-${argument.name}`;

  function renderControl() {
    if (argument.have_options && argument.options) {
      return <SelectField fieldId={fieldId} node={node} argument={argument} />;
    }

    switch (argument.argument_type) {
      case 'NUMBER':
        return (
          <NumberField fieldId={fieldId} node={node} argument={argument} />
        );

      case 'BOOLEAN':
        return (
          <BooleanField fieldId={fieldId} node={node} argument={argument} />
        );

      case 'TEXT':
        return <TextField fieldId={fieldId} node={node} argument={argument} />;

      default:
        return <div>Not implemented</div>;
    }
  }

  return (
    <div className='flex flex-col gap-1 px-2 py-1.5'>
      <Label htmlFor={fieldId} className='text-muted-foreground text-xs'>
        {formatLabel(argument.name)}
        {argument.is_required && <span className='text-destructive'>*</span>}
      </Label>

      {renderControl()}
    </div>
  );
}
