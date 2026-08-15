'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2Icon } from 'lucide-react';

import { PAGE_COMPONENT_META } from '../_constants/page-component-meta';
import { usePageStore } from '../_store/page-store';

import type { Id } from '@/convex/_generated/dataModel';
import type { NodeOption } from '../_lib/bindable-nodes';

const NO_BINDING = '__none__';

type PagePropertiesPanelProps = {
  target: { workspaceName: string; pageId: Id<'pages'> };
  inputNodes: NodeOption[];
  outputNodes: NodeOption[];
  hasWorkflow: boolean;
};

export function PagePropertiesPanel({
  target,
  inputNodes,
  outputNodes,
  hasWorkflow,
}: PagePropertiesPanelProps) {
  const components = usePageStore((s) => s.components);
  const selectedId = usePageStore((s) => s.selectedId);
  const updateProps = usePageStore((s) => s.updateProps);
  const setBinding = usePageStore((s) => s.setBinding);
  const removeComponent = usePageStore((s) => s.removeComponent);

  const selected = components.find((c) => c.id === selectedId) ?? null;

  if (selected === null) {
    return (
      <aside className='flex w-72 shrink-0 flex-col border-l p-4'>
        <p className='text-muted-foreground text-sm'>
          Select a component to edit its properties.
        </p>
      </aside>
    );
  }

  const meta = PAGE_COMPONENT_META[selected.type];
  let bindingOptions: NodeOption[] | null = null;
  if (meta.binds === 'input') {
    bindingOptions = inputNodes;
  } else if (meta.binds === 'output') {
    bindingOptions = outputNodes;
  }

  function setProp(key: string, value: unknown) {
    if (selected) {
      updateProps(target, selected.id, { [key]: value });
    }
  }

  function renderBindingControl() {
    if (selected === null || bindingOptions === null) {
      return null;
    }
    if (!hasWorkflow) {
      return (
        <p className='text-muted-foreground text-xs'>
          Pick a workflow for this page first.
        </p>
      );
    }
    if (bindingOptions.length === 0) {
      return (
        <p className='text-muted-foreground text-xs'>
          {meta.binds === 'input'
            ? 'This workflow has no input nodes.'
            : 'This workflow has no output nodes.'}
        </p>
      );
    }
    const items: Record<string, string> = {
      [NO_BINDING]: '— None —',
      ...Object.fromEntries(
        bindingOptions.map((option) => [option.nodeId, option.label])
      ),
    };
    return (
      <Select
        items={items}
        value={selected.bindingNodeId ?? NO_BINDING}
        onValueChange={(value) => {
          setBinding(
            target,
            selected.id,
            !value || value === NO_BINDING ? undefined : value
          );
        }}
      >
        <SelectTrigger size='sm' className='w-full'>
          <SelectValue placeholder='Choose a node…' />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value={NO_BINDING}>— None —</SelectItem>
          {bindingOptions.map((option) => (
            <SelectItem key={option.nodeId} value={option.nodeId}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <aside className='flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l p-4'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium'>{meta.label}</span>
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={() => {
            removeComponent(target, selected.id);
          }}
        >
          <Trash2Icon />
        </Button>
      </div>

      {/* Text-bearing props */}
      {(selected.type === 'HEADING' ||
        selected.type === 'TEXT' ||
        selected.type === 'BUTTON') && (
        <div className='flex flex-col gap-1.5'>
          <Label className='text-xs'>Text</Label>
          <Input
            value={typeof selected.props.text === 'string' ? selected.props.text : ''}
            onChange={(e) => {
              setProp('text', e.target.value);
            }}
          />
        </div>
      )}

      {/* Labeled inputs/output */}
      {(selected.type === 'TEXT_INPUT' ||
        selected.type === 'FILE_INPUT' ||
        selected.type === 'OUTPUT') && (
        <div className='flex flex-col gap-1.5'>
          <Label className='text-xs'>Label</Label>
          <Input
            value={
              typeof selected.props.label === 'string' ? selected.props.label : ''
            }
            onChange={(e) => {
              setProp('label', e.target.value);
            }}
          />
        </div>
      )}

      {selected.type === 'TEXT_INPUT' && (
        <>
          <div className='flex flex-col gap-1.5'>
            <Label className='text-xs'>Placeholder</Label>
            <Input
              value={
                typeof selected.props.placeholder === 'string'
                  ? selected.props.placeholder
                  : ''
              }
              onChange={(e) => {
                setProp('placeholder', e.target.value);
              }}
            />
          </div>
          <div className='flex items-center justify-between'>
            <Label className='text-xs'>Multiline</Label>
            <Switch
              checked={selected.props.multiline !== false}
              onCheckedChange={(checked) => {
                setProp('multiline', checked);
              }}
            />
          </div>
        </>
      )}

      {/* Workflow-node binding */}
      {bindingOptions !== null && (
        <div className='flex flex-col gap-1.5'>
          <Label className='text-xs'>
            {meta.binds === 'input'
              ? 'Feeds workflow input'
              : 'Shows workflow output'}
          </Label>
          {renderBindingControl()}
        </div>
      )}
    </aside>
  );
}
