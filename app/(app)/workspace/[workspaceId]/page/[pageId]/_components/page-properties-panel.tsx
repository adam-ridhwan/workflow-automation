'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { CopyIcon, Trash2Icon } from 'lucide-react';

import { PAGE_COMPONENT_META } from '../_constants/page-component-meta';
import { usePageStore } from '../_store/page-store';

import type { NodeOption } from '../_lib/bindable-nodes';
import type { Id } from '@/convex/_generated/dataModel';

const NO_BINDING = '__none__';

type PagePropertiesPanelProps = {
  target: { workspaceId: Id<'workspaces'>; pageId: Id<'pages'> };
  inputNodes: NodeOption[];
  outputNodes: NodeOption[];
  hasWorkflow: boolean;
};

/** Floating inspector for the selected component, top-right of the canvas.
 * Hidden when nothing is selected, like the workflow node panel. */
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
  const duplicateComponent = usePageStore((s) => s.duplicateComponent);

  const selected = components.find((c) => c.id === selectedId) ?? null;

  if (selected === null) {
    return null;
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
    <div
      className='absolute top-4 right-4 bottom-4 z-10 flex w-72'
      data-page-panel
    >
      <Card className='flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0'>
        <div
          className='flex h-11 items-center justify-between gap-2 border-b px-3'
        >
          <span className='text-sm font-medium'>{meta.label}</span>
          <div className='flex items-center gap-0.5'>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label='Duplicate'
              onClick={() => {
                duplicateComponent(target, selected.id);
              }}
            >
              <CopyIcon />
            </Button>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label='Delete'
              onClick={() => {
                removeComponent(target, selected.id);
              }}
            >
              <Trash2Icon />
            </Button>
          </div>
        </div>

        <div className='flex flex-col gap-4 overflow-y-auto p-4'>
          {/* Text-bearing props */}
          {(selected.type === 'HEADING' ||
            selected.type === 'TEXT' ||
            selected.type === 'BUTTON') && (
            <div className='flex flex-col gap-1.5'>
              <Label className='text-xs'>Text</Label>
              <Input
                value={
                  typeof selected.props.text === 'string'
                    ? selected.props.text
                    : ''
                }
                onChange={(e) => {
                  setProp('text', e.target.value);
                }}
              />
            </div>
          )}

          {/* Labeled inputs/output */}
          {(selected.type === 'TEXT_INPUT' ||
            selected.type === 'NUMBER_INPUT' ||
            selected.type === 'SELECT' ||
            selected.type === 'CHECKBOX' ||
            selected.type === 'FILE_INPUT' ||
            selected.type === 'OUTPUT') && (
            <div className='flex flex-col gap-1.5'>
              <Label className='text-xs'>Label</Label>
              <Input
                value={
                  typeof selected.props.label === 'string'
                    ? selected.props.label
                    : ''
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

          {selected.type === 'NUMBER_INPUT' && (
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
          )}

          {selected.type === 'SELECT' && (
            <div className='flex flex-col gap-1.5'>
              <Label className='text-xs'>Options (one per line)</Label>
              <Textarea
                value={
                  typeof selected.props.options === 'string'
                    ? selected.props.options
                    : ''
                }
                onChange={(e) => {
                  setProp('options', e.target.value);
                }}
                className='min-h-24'
              />
            </div>
          )}

          {selected.type === 'IMAGE' && (
            <>
              <div className='flex flex-col gap-1.5'>
                <Label className='text-xs'>Image URL</Label>
                <Input
                  value={
                    typeof selected.props.url === 'string'
                      ? selected.props.url
                      : ''
                  }
                  onChange={(e) => {
                    setProp('url', e.target.value);
                  }}
                  placeholder='https://…'
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label className='text-xs'>Alt text</Label>
                <Input
                  value={
                    typeof selected.props.alt === 'string'
                      ? selected.props.alt
                      : ''
                  }
                  onChange={(e) => {
                    setProp('alt', e.target.value);
                  }}
                />
              </div>
            </>
          )}

          {selected.type === 'BUTTON' && (
            <div className='flex flex-col gap-1.5'>
              <Label className='text-xs'>Action</Label>
              <Select
                items={{ run: 'Run workflow', clear: 'Clear inputs' }}
                value={
                  typeof selected.props.action === 'string'
                    ? selected.props.action
                    : 'run'
                }
                onValueChange={(next) => {
                  setProp('action', next ?? 'run');
                }}
              >
                <SelectTrigger size='sm' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value='run'>Run workflow</SelectItem>
                  <SelectItem value='clear'>Clear inputs</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
        </div>
      </Card>
    </div>
  );
}
