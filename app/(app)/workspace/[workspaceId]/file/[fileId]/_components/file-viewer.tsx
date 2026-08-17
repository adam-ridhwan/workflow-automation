'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/components/ui/markdown';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { DownloadIcon, Loader2Icon, PrinterIcon } from 'lucide-react';
import Link from 'next/link';

import type { Id } from '@/convex/_generated/dataModel';

type FileViewerProps = {
  workspaceId: Id<'workspaces'>;
  fileId: string;
};

/** Single-file viewer (text files for now). Fetches the file's text from its
 * storage URL; when a workflow that writes this file finishes, the `view` query
 * returns a new URL and the content re-fetches automatically. */
export function FileViewer({ workspaceId, fileId }: FileViewerProps) {
  const data = useQuery(api.files.view, {
    workspaceId,
    fileId: fileId as Id<'files'>,
  });
  const url = data?.url ?? null;
  // Keep the loaded text tagged with the URL it came from, so a stale fetch —
  // or the old file before a re-run's new URL loads — is never shown.
  const [loaded, setLoaded] = useState<{ url: string; text: string } | null>(
    null
  );

  // Re-fetch whenever the URL changes — including when a run replaces the file
  // (the new blob yields a new URL). setState only runs in async callbacks.
  useEffect(() => {
    if (url === null) {
      return;
    }
    let cancelled = false;
    fetch(url)
      .then((response) => response.text())
      .then((text) => {
        if (!cancelled) {
          setLoaded({ url, text });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoaded({ url, text: '' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const content = loaded?.url === url ? loaded.text : null;
  const loadingContent = url !== null && content === null;

  const filesHref = `/workspace/${workspaceId}/files`;

  if (data === undefined) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <Loader2Icon className='text-muted-foreground size-5 animate-spin' />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className='flex flex-1 flex-col items-center justify-center gap-3'>
        <p className='text-muted-foreground text-sm'>File not found.</p>
        <Link href={filesHref} className='text-sm underline'>
          Back to files
        </Link>
      </div>
    );
  }

  let body = <Markdown>{content ?? ''}</Markdown>;
  if (loadingContent) {
    body = (
      <Loader2Icon className='text-muted-foreground size-4 animate-spin' />
    );
  } else if (!content) {
    body = <p className='text-muted-foreground text-sm'>This file is empty.</p>;
  }

  return (
    <div className='relative flex min-h-0 flex-1 flex-col'>
      {/* Sub-header: document actions, right-aligned. */}
      <div
        className='flex h-13 shrink-0 items-center justify-end gap-1 border-b
          px-3'
      >
        <Button
          variant='ghost'
          size='sm'
          className='gap-1.5'
          onClick={() => {
            window.print();
          }}
        >
          <PrinterIcon className='size-3.5' />
          Print
        </Button>
        <Button
          variant='ghost'
          size='sm'
          className='gap-1.5'
          nativeButton={false}
          disabled={!data.url}
          render={
            <a
              href={data.url ?? undefined}
              download={data.name}
              target='_blank'
              rel='noreferrer'
            />
          }
        >
          <DownloadIcon className='size-3.5' />
          Download
        </Button>
      </div>

      {data.workflowRunning && (
        <div
          className='animate-in fade-in slide-in-from-top-2 absolute top-16
            right-4 z-20 w-80 max-w-[calc(100%-2rem)] duration-200'
        >
          <Alert className='bg-popover shadow-lg'>
            <Loader2Icon className='animate-spin' />
            <AlertTitle>A workflow is running in the background</AlertTitle>
            <AlertDescription>
              This file will update automatically when it finishes.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* A centered "document page" on a muted canvas, like a doc editor. */}
      <div
        className='nowheel bg-background min-h-0 flex-1 overflow-auto px-6 py-8'
      >
        <div
          className='bg-card mx-auto min-h-[40vh] w-full max-w-3xl rounded-lg
            border px-12 py-12 shadow-sm'
        >
          {body}
        </div>
      </div>
    </div>
  );
}
