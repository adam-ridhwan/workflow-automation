'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Markdown } from '@/components/ui/markdown';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/cn';

import type { PageComponentData } from '@/convex/pageLayout';

type FileOption = { _id: string; name: string };

type PageComponentViewProps = {
  component: PageComponentData;
  mode: 'edit' | 'preview';
  /** Preview runtime — current value for input components. */
  value?: string;
  onValueChange?: (value: string) => void;
  fileOptions?: FileOption[];
  /** Preview runtime — produced text for OUTPUT components. */
  outputValue?: string;
  isRunning?: boolean;
  onRun?: () => void;
  onClear?: () => void;
  canRun?: boolean;
};

function propString(component: PageComponentData, key: string, fallback = '') {
  const value = component.props[key];
  return typeof value === 'string' ? value : fallback;
}

/** Parse a SELECT's newline-separated options prop into a clean list. */
function selectOptions(component: PageComponentData): string[] {
  return propString(component, 'options')
    .split('\n')
    .map((option) => option.trim())
    .filter((option) => option.length > 0);
}

export function PageComponentView({
  component,
  mode,
  value,
  onValueChange,
  fileOptions,
  outputValue,
  isRunning,
  onRun,
  onClear,
  canRun,
}: PageComponentViewProps) {
  const isEdit = mode === 'edit';

  switch (component.type) {
    case 'HEADING':
      return (
        <h2 className='text-lg font-semibold tracking-tight'>
          {propString(component, 'text', 'Heading')}
        </h2>
      );

    case 'TEXT':
      return (
        <Markdown className='text-muted-foreground text-sm'>
          {propString(component, 'text')}
        </Markdown>
      );

    case 'DIVIDER':
      return (
        <div className='flex h-full items-center'>
          <hr className='border-border w-full border-t' />
        </div>
      );

    case 'IMAGE': {
      const url = propString(component, 'url');
      const alt = propString(component, 'alt');
      if (!url) {
        return (
          <div className='bg-muted/40 text-muted-foreground flex h-full w-full items-center justify-center rounded-lg border text-xs'>
            Set an image URL
          </div>
        );
      }
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          className='h-full w-full rounded-lg object-cover'
        />
      );
    }

    case 'TEXT_INPUT': {
      const multiline = component.props.multiline !== false;
      const label = propString(component, 'label', 'Input');
      const placeholder = propString(component, 'placeholder');
      return (
        <div className='flex h-full flex-col gap-1.5'>
          <Label className='text-xs'>{label}</Label>
          {multiline ? (
            <Textarea
              value={isEdit ? '' : (value ?? '')}
              onChange={(e) => onValueChange?.(e.target.value)}
              placeholder={placeholder}
              disabled={isEdit}
              className='min-h-0 flex-1 resize-none'
            />
          ) : (
            <Input
              value={isEdit ? '' : (value ?? '')}
              onChange={(e) => onValueChange?.(e.target.value)}
              placeholder={placeholder}
              disabled={isEdit}
            />
          )}
        </div>
      );
    }

    case 'NUMBER_INPUT': {
      const label = propString(component, 'label', 'Number');
      const placeholder = propString(component, 'placeholder');
      return (
        <div className='flex flex-col gap-1.5'>
          <Label className='text-xs'>{label}</Label>
          <Input
            type='number'
            value={isEdit ? '' : (value ?? '')}
            onChange={(e) => onValueChange?.(e.target.value)}
            placeholder={placeholder}
            disabled={isEdit}
          />
        </div>
      );
    }

    case 'SELECT': {
      const label = propString(component, 'label', 'Select');
      const options = selectOptions(component);
      const items = Object.fromEntries(
        options.map((option) => [option, option])
      );
      return (
        <div className='flex flex-col gap-1.5'>
          <Label className='text-xs'>{label}</Label>
          <Select
            items={items}
            value={value ?? ''}
            onValueChange={(next) => onValueChange?.(next ?? '')}
            disabled={isEdit}
          >
            <SelectTrigger size='sm' className='w-full'>
              <SelectValue placeholder='Choose…' />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    case 'CHECKBOX': {
      const label = propString(component, 'label', 'Enabled');
      return (
        <label className='flex h-full items-center gap-2 text-sm select-none'>
          <Switch
            checked={!isEdit && value === 'true'}
            onCheckedChange={(checked) => onValueChange?.(String(checked))}
            disabled={isEdit}
          />
          <span>{label}</span>
        </label>
      );
    }

    case 'FILE_INPUT': {
      const label = propString(component, 'label', 'File');
      const fileItems = Object.fromEntries(
        (fileOptions ?? []).map((file) => [file._id, file.name])
      );
      return (
        <div className='flex flex-col gap-1.5'>
          <Label className='text-xs'>{label}</Label>
          <Select
            items={fileItems}
            value={value ?? ''}
            onValueChange={(next) => onValueChange?.(next ?? '')}
            disabled={isEdit}
          >
            <SelectTrigger size='sm' className='w-full'>
              <SelectValue placeholder='Select a file…' />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {(fileOptions ?? []).map((file) => (
                <SelectItem key={file._id} value={file._id}>
                  {file.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    case 'BUTTON': {
      const isClear = propString(component, 'action', 'run') === 'clear';
      const fallbackText = isClear ? 'Clear' : 'Run';
      return (
        <Button
          className='w-full'
          variant={isClear ? 'outline' : 'default'}
          disabled={isEdit || (!isClear && (isRunning || canRun === false))}
          onClick={() => {
            if (isEdit) {
              return;
            }
            if (isClear) {
              onClear?.();
            } else {
              onRun?.();
            }
          }}
        >
          {!isClear && isRunning
            ? 'Running…'
            : propString(component, 'text', fallbackText)}
        </Button>
      );
    }

    case 'OUTPUT': {
      const label = propString(component, 'label', 'Output');
      const hasOutput = !isEdit && !!outputValue;
      return (
        <div className='flex h-full flex-col gap-1.5'>
          <Label className='text-xs'>{label}</Label>
          <div
            className={cn(
              `bg-muted/40 min-h-0 flex-1 overflow-y-auto rounded-lg border p-3 text-sm`,
              !hasOutput && 'text-muted-foreground flex items-center'
            )}
          >
            {hasOutput ? (
              <Markdown>{outputValue}</Markdown>
            ) : (
              <span className='italic'>
                {isRunning ? 'Running…' : 'Output appears here after a run.'}
              </span>
            )}
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
