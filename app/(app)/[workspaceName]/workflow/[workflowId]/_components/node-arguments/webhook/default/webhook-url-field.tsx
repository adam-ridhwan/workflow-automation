'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { api } from '@/convex/_generated/api';
import { getArgumentValue } from '@/lib/node-specs';
import { useMutation, useQuery } from 'convex/react';
import { CheckIcon, CopyIcon, RefreshCwIcon, ZapIcon } from 'lucide-react';

import { useWorkspaceParams } from '../../../../../../_hooks/use-workspace-params';
import { useCanvasMode } from '../../../workflow-canvas/canvas-mode-context';

import type { WorkflowNodeData } from '@/convex/canvas';

type WebhookUrlFieldProps = {
  data: WorkflowNodeData;
};

/** Read-only display of the workflow's inbound webhook URL, with enable, copy,
 * regenerate, a one-click "send test event", and a ready-to-run curl example.
 * POSTing JSON to this URL triggers a run, feeding the request body to the
 * WEBHOOK node. */
export function WebhookUrlField({ data }: WebhookUrlFieldProps) {
  const { workspaceName, workflowId } = useWorkspaceParams();
  const url = useQuery(api.workflows.webhookUrl, { workspaceName, workflowId });
  const ensureWebhook = useMutation(api.workflows.ensureWebhook);
  const regenerateWebhook = useMutation(api.workflows.regenerateWebhook);
  const sendTestEvent = useMutation(api.workflows.sendTestEvent);
  const { readOnly } = useCanvasMode();
  const [copied, setCopied] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);

  if (url === undefined) {
    return <Skeleton className='h-7 w-full rounded-md' />;
  }

  if (url === null) {
    return (
      <Button
        variant='outline'
        size='sm'
        className='h-7 w-full text-[13px]'
        disabled={readOnly || busy}
        onClick={async () => {
          setBusy(true);
          try {
            await ensureWebhook({ workspaceName, workflowId });
          } catch {
            toast.add({
              type: 'error',
              title: 'Could not enable the webhook.',
            });
          } finally {
            setBusy(false);
          }
        }}
      >
        Enable webhook
      </Button>
    );
  }

  // Narrowed to a string here; capture it so the closures keep the type.
  const webhookUrl = url;
  const curlExample = `curl -X POST '${webhookUrl}' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"event": "signup", "user": "ada"}'`;

  async function copyText(text: string, mark: (value: boolean) => void) {
    try {
      await navigator.clipboard.writeText(text);
      mark(true);
      setTimeout(() => {
        mark(false);
      }, 1500);
    } catch {
      toast.add({ type: 'error', title: 'Could not copy.' });
    }
  }

  async function sendTest() {
    setSending(true);
    try {
      // Fire a run with this node's sample payload — the same path an inbound
      // POST takes, minus the HTTP round-trip.
      await sendTestEvent({
        workspaceName,
        workflowId,
        payload: String(getArgumentValue(data, 'payload') ?? ''),
      });
      toast.add({
        type: 'success',
        title: 'Test event sent — see the Runs tab.',
      });
    } catch {
      toast.add({ type: 'error', title: 'Could not send the test event.' });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className='flex flex-col gap-1.5'>
      <div className='flex items-center gap-1'>
        <Input
          readOnly
          value={webhookUrl}
          onFocus={(event) => {
            event.currentTarget.select();
          }}
          className='h-7 text-[12px]'
        />
        <Button
          type='button'
          variant='outline'
          size='icon'
          className='size-7 shrink-0'
          aria-label='Copy webhook URL'
          onClick={() => {
            copyText(webhookUrl, setCopied);
          }}
        >
          {copied ? (
            <CheckIcon className='size-3.5' />
          ) : (
            <CopyIcon className='size-3.5' />
          )}
        </Button>
      </div>

      <Button
        type='button'
        size='sm'
        className='h-7 w-full gap-1.5 text-[13px]'
        disabled={readOnly || sending}
        onClick={() => {
          sendTest();
        }}
      >
        <ZapIcon className='size-3.5' />
        {sending ? 'Sending…' : 'Send test event'}
      </Button>

      <div className='flex items-center justify-between'>
        <span className='text-muted-foreground text-[11px]'>
          POST JSON here to trigger a run.
        </span>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='text-muted-foreground h-6 gap-1 text-[11px]'
          disabled={readOnly || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await regenerateWebhook({ workspaceName, workflowId });
              toast.add({ type: 'success', title: 'Webhook URL regenerated.' });
            } catch {
              toast.add({ type: 'error', title: 'Could not regenerate.' });
            } finally {
              setBusy(false);
            }
          }}
        >
          <RefreshCwIcon className='size-3' />
          Regenerate
        </Button>
      </div>

      <div className='mt-0.5 flex flex-col gap-1'>
        <div className='flex items-center justify-between'>
          <span className='text-muted-foreground text-[11px] font-medium'>
            Example request
          </span>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='text-muted-foreground h-6 gap-1 text-[11px]'
            onClick={() => {
              copyText(curlExample, setCopiedCurl);
            }}
          >
            {copiedCurl ? (
              <CheckIcon className='size-3' />
            ) : (
              <CopyIcon className='size-3' />
            )}
            Copy
          </Button>
        </div>
        <pre
          className='bg-muted text-foreground/80 overflow-x-auto rounded-md
            border p-2 font-mono text-[10.5px] leading-relaxed'
        >
          {curlExample}
        </pre>
      </div>
    </div>
  );
}
