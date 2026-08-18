'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { api } from '@/convex/_generated/api';
import { WORKFLOW_TEMPLATES } from '@/lib/workflow-templates';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { useRouter, useSearchParams } from 'next/navigation';

import { useWorkspaceParams } from '../../_hooks/use-workspace-params';
import { revalidateWorkflows } from '../../workflows/_lib/revalidate-workflows';

import type { Folder } from '@/convex/folders';

/** Full-page "new workflow" experience: pick a template, or name a blank one at
 * the bottom. Either path lands on the new workflow's canvas. */
export default function CreateWorkflowPage() {
  const { workspaceId } = useWorkspaceParams();
  const searchParams = useSearchParams();
  // Preserve folder scope when opened from a folder view.
  const folderId =
    (searchParams.get('folderId') as Folder['_id'] | null) ?? undefined;

  const router = useRouter();
  const createWorkflow = useMutation(api.workflows.create);
  const createFromTemplate = useMutation(api.workflows.createFromTemplate);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<string | null>(null);

  function fail(error: unknown, fallback: string) {
    toast.add({
      type: 'error',
      title:
        error instanceof ConvexError && typeof error.data === 'string'
          ? error.data
          : fallback,
    });
    setBusy(false);
    setPendingTemplate(null);
  }

  function openCanvas(workflowId: string) {
    router.replace(`/workspace/${workspaceId}/workflow/${workflowId}/canvas`);
  }

  async function pickTemplate(templateId: string) {
    if (busy) {
      return;
    }
    setBusy(true);
    setPendingTemplate(templateId);
    try {
      const workflowId = await createFromTemplate({
        workspaceId,
        templateId,
        folderId,
      });
      await revalidateWorkflows(workspaceId, folderId);
      openCanvas(workflowId);
    } catch (error) {
      fail(error, 'Could not create workflow from template. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function createBlank(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) {
      return;
    }
    setBusy(true);
    try {
      const workflowId = await createWorkflow({
        workspaceId,
        name: trimmed,
        description: description.trim() ? description.trim() : undefined,
        folderId,
      });
      await revalidateWorkflows(workspaceId, folderId);
      openCanvas(workflowId);
    } catch (error) {
      fail(error, 'Could not create workflow. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className='min-h-0 flex-1 overflow-y-auto'>
      <div className='mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Create a workflow
          </h1>
          <p className='text-muted-foreground text-sm'>
            Start from a template, or build one from scratch below.
          </p>
        </div>

        {/* Template grid */}
        <div className='flex flex-col gap-3'>
          <div
            className='text-muted-foreground text-xs font-medium tracking-wide
              uppercase'
          >
            Templates
          </div>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {WORKFLOW_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type='button'
                disabled={busy}
                onClick={() => {
                  pickTemplate(template.id);
                }}
                className='hover:border-primary/40 hover:bg-accent/40
                  focus-visible:border-ring focus-visible:ring-ring/50 flex
                  cursor-pointer flex-col gap-1 rounded-lg border p-4 text-left
                  transition-colors focus-visible:ring-[3px]
                  focus-visible:outline-none disabled:pointer-events-none
                  disabled:opacity-60'
              >
                <span className='text-[13px] font-medium'>{template.name}</span>
                <span className='text-muted-foreground text-xs'>
                  {pendingTemplate === template.id
                    ? 'Creating…'
                    : template.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* From scratch — a compact inline quick-add row. (Future: an
            "describe your workflow to AI" chat box could live alongside this.) */}
        <div className='flex flex-col gap-2'>
          <div
            className='text-muted-foreground text-xs font-medium tracking-wide
              uppercase'
          >
            Or start from scratch
          </div>
          <form onSubmit={createBlank} className='flex items-center gap-2'>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              placeholder='Workflow name'
              aria-label='Workflow name'
              className='min-w-0 flex-1'
              autoFocus
            />
            <Input
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              placeholder='Description (optional)'
              aria-label='Workflow description'
              className='min-w-0 flex-1'
            />
            <Button
              type='submit'
              className='shrink-0'
              disabled={busy || name.trim().length === 0}
            >
              {busy && pendingTemplate === null ? 'Creating…' : 'Create'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
