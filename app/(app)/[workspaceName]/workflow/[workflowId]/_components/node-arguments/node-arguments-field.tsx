'use client';

import { Field, FieldLabel } from '@/components/ui/field';
import { getArgumentValue } from '@/lib/node-specs';

import { BooleanField } from './boolean/default/boolean-field';
import { NumberField } from './number/default/number-field';
import { FileSelectField } from './select/custom/file-select-field';
import { SelectField } from './select/default/select-field';
import { TextField } from './text/default/text-field';
import { WebhookUrlField } from './webhook/default/webhook-url-field';

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

  const value = getArgumentValue(data, argument.name);

  // Sub-argument that depends on this argument's current value (e.g. `model`
  // under the selected `provider`).
  const childArgument = argument.have_sub_arguments
    ? argument.children[String(value ?? '')]
    : undefined;

  function renderControl() {
    if (argument.display === 'webhook_url') {
      return <WebhookUrlField data={data} />;
    }

    if (argument.select_source === 'files') {
      return (
        <FileSelectField
          fieldId={fieldId}
          nodeId={nodeId}
          data={data}
          argument={argument}
        />
      );
    }

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
      <Field className='gap-1 px-3 py-1.5'>
        <FieldLabel
          htmlFor={fieldId}
          className='text-muted-foreground gap-0.5 text-xs'
        >
          {formatLabel(argument.name)}
          {argument.is_required && <span className='text-destructive'>*</span>}
        </FieldLabel>

        {renderControl()}
      </Field>

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
