'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { api } from '@/convex/_generated/api';
import { WORKFLOW_TEMPLATES } from '@/lib/workflow-templates';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { useRouter } from 'next/navigation';

import { revalidateWorkflows } from '../_lib/revalidate-workflows';
import { useWorkspaceParams } from '../../_hooks/use-workspace-params';

import type { Folder } from '@/convex/folders';

type NewWorkflowDialogProps = {
  folderId?: Folder['_id'];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewWorkflowDialog({
  folderId,
  open,
  onOpenChange,
}: NewWorkflowDialogProps) {
  const { workspaceName } = useWorkspaceParams();
  const createWorkflow = useMutation(api.workflows.create);
  const createFromTemplate = useMutation(api.workflows.createFromTemplate);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(
    null
  );

  const busy = submitting || creatingTemplateId !== null;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setError(null);
      setSubmitting(false);
      setCreatingTemplateId(null);
    }
    onOpenChange(nextOpen);
  }

  async function handleUseTemplate(templateId: string) {
    setError(null);
    setCreatingTemplateId(templateId);
    try {
      const workflowId = await createFromTemplate({
        workspaceName,
        templateId,
        folderId,
      });
      // Revalidate the list server-side so it's fresh when the user comes back,
      // then jump straight into the new workflow's canvas.
      await revalidateWorkflows(workspaceName, folderId);
      handleOpenChange(false);
      router.push(
        `/${encodeURIComponent(workspaceName)}/workflow/${workflowId}/canvas`
      );
    } catch (err) {
      setError(
        err instanceof ConvexError && typeof err.data === 'string'
          ? err.data
          : 'Could not create workflow from template. Please try again.'
      );
      setCreatingTemplateId(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();

    setSubmitting(true);
    try {
      await createWorkflow({
        workspaceName,
        name,
        description: description ? description : undefined,
        folderId,
      });
      handleOpenChange(false);
      // The workflows table is fetched server-side; refresh to pick it up.
      router.refresh();
    } catch (err) {
      if (err instanceof ConvexError && typeof err.data === 'string') {
        setError(err.data);
      } else {
        setError('Could not create workflow. Please try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>New workflow</DialogTitle>
          <DialogDescription>
            Start from a template, or create a blank workflow.
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-2'>
          <div
            className='text-muted-foreground text-xs font-medium tracking-wide
              uppercase'
          >
            Templates
          </div>
          <div className='grid max-h-56 gap-2 overflow-y-auto'>
            {WORKFLOW_TEMPLATES.map((template) => (
              <Button
                key={template.id}
                type='button'
                variant='outline'
                disabled={busy}
                onClick={() => {
                  handleUseTemplate(template.id);
                }}
                className='h-auto w-full flex-col items-start gap-0.5 px-3 py-2
                  text-left whitespace-normal'
              >
                <span className='text-[13px] font-medium'>{template.name}</span>
                <span className='text-muted-foreground text-xs font-normal'>
                  {creatingTemplateId === template.id
                    ? 'Creating…'
                    : template.description}
                </span>
              </Button>
            ))}
          </div>
        </div>

        <div className='text-muted-foreground flex items-center gap-3 text-xs'>
          <Separator className='flex-1' />
          or start blank
          <Separator className='flex-1' />
        </div>

        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          <Field>
            <FieldLabel htmlFor='workflow-name'>Name</FieldLabel>
            <Input
              id='workflow-name'
              name='name'
              type='text'
              placeholder='Invoice processing'
              aria-invalid={error ? true : undefined}
              required
            />
            {error && (
              <FieldDescription className='text-destructive'>
                {error}
              </FieldDescription>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor='workflow-description'>Description</FieldLabel>
            <Input
              id='workflow-description'
              name='description'
              type='text'
              placeholder='What does this workflow do? (optional)'
            />
          </Field>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={busy}>
              {submitting ? 'Creating…' : 'Create workflow'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
