'use client';

import { Label } from '@/components/ui/label';
import { getArgumentValue } from '@/lib/node-specs';

import { BooleanField } from './boolean/default/boolean-field';
import { NumberField } from './number/default/number-field';
import { SelectField } from './select/default/select-field';
import { TextField } from './text/default/text-field';

import type { WorkflowNodeData } from '@/convex/canvas';
import type { NodeArgument } from '@/lib/node-specs';

/** "max_tokens" -> "Max tokens" */
function formatLabel(name: string) {
  const spaced = name.replaceAll('_', ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

type NodeArgumentsFieldProps = {
  nodeId: string;
  data: WorkflowNodeData;
  argument: NodeArgument;
};

export function NodeArgumentsField({
  nodeId,
  data,
  argument,
}: NodeArgumentsFieldProps) {
  const fieldId = `arg-${nodeId}-${argument.name}`;

  // Sub-argument that depends on this argument's current value (e.g. `model`
  // under the selected `provider`).
  const childArgument = argument.have_sub_arguments
    ? argument.children[String(getArgumentValue(data, argument.name) ?? '')]
    : undefined;

  function renderControl() {
    if (argument.have_options && argument.options) {
      return (
        <SelectField
          fieldId={fieldId}
          nodeId={nodeId}
          data={data}
          argument={argument}
        />
      );
    }

    switch (argument.argument_type) {
      case 'NUMBER':
        return (
          <NumberField
            fieldId={fieldId}
            nodeId={nodeId}
            data={data}
            argument={argument}
          />
        );

      case 'BOOLEAN':
        return (
          <BooleanField
            fieldId={fieldId}
            nodeId={nodeId}
            data={data}
            argument={argument}
          />
        );

      case 'TEXT':
        return (
          <TextField
            fieldId={fieldId}
            nodeId={nodeId}
            data={data}
            argument={argument}
          />
        );

      default:
        return <div>Not implemented</div>;
    }
  }

  return (
    <>
      <div className='flex flex-col gap-1 px-3 py-1.5'>
        <Label htmlFor={fieldId} className='text-muted-foreground text-xs'>
          {formatLabel(argument.name)}
          {argument.is_required && <span className='text-destructive'>*</span>}
        </Label>

        {renderControl()}
      </div>

      {childArgument && (
        <NodeArgumentsField
          nodeId={nodeId}
          data={data}
          argument={childArgument}
        />
      )}
    </>
  );
}
