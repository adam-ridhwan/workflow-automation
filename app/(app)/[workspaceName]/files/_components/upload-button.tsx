'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { UploadIcon } from 'lucide-react';

import { useWorkspaceParams } from '../../_hooks/use-workspace-params';

import type { Id } from '@/convex/_generated/dataModel';
import type { Folder } from '@/convex/folders';
import type { ComponentProps } from 'react';

// Files larger than this are uploaded in chunks of this size; smaller files go
// up in a single request. Convex upload URLs take one blob per request, so
// chunks are stored as temporary blobs and reassembled server-side.
const CHUNK_SIZE = 5 * 1024 * 1024;
const CHUNK_RETRIES = 3;
// Throttle transfer-progress writes so a fast upload doesn't flood the backend.
const PROGRESS_INTERVAL_MS = 250;

type UploadButtonProps = {
  /** Upload destination; omit to upload to the workspace root. */
  folderId?: Folder['_id'];
  variant?: ComponentProps<typeof Button>['variant'];
  size?: ComponentProps<typeof Button>['size'];
  className?: string;
  children?: React.ReactNode;
};

/** POSTs a blob (a whole file or one chunk) to a Convex upload URL, reporting
 * transfer progress. Uses XHR because fetch can't observe upload progress.
 * Resolves to the `storageId` of the stored blob. */
function uploadWithProgress(
  url: string,
  blob: Blob,
  contentType: string,
  onProgress: (loadedBytes: number) => void
) {
  return new Promise<{ storageId: Id<'_storage'> }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(e.loaded);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as { storageId: Id<'_storage'> });
      } else {
        reject(new Error(`Upload failed (${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error('Upload failed.'));
    xhr.send(blob);
  });
}

async function withRetry<T>(fn: () => Promise<T>, attempts: number) {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/** Uploads one or more files, showing each file's progress inline in the list.
 * A row is created up front (`uploading`), transfer progress streams to it, and
 * files over `CHUNK_SIZE` are split into chunks — each uploaded (and retried) on
 * its own request, then reassembled server-side. Shared by the files header and
 * the empty state. */
export function UploadButton({
  folderId,
  variant,
  size = 'sm',
  className = 'h-8',
  children,
}: UploadButtonProps) {
  const { workspaceName } = useWorkspaceParams();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const startUpload = useMutation(api.files.startUpload);
  const setUploadProgress = useMutation(api.files.setUploadProgress);
  const addChunk = useMutation(api.files.addChunk);
  const finishUpload = useMutation(api.files.finishUpload);
  const cancelUpload = useMutation(api.files.cancelUpload);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadOne(file: File) {
    const contentType = file.type || 'application/octet-stream';
    const fileId = await startUpload({
      workspaceName,
      name: file.name,
      size: file.size,
      contentType,
      folderId,
    });

    try {
      // Report absolute transferred bytes as a percentage, throttled.
      let lastSent = 0;
      const report = (loadedTotal: number) => {
        const now = Date.now();
        const progress = Math.round((loadedTotal / (file.size || 1)) * 100);
        if (now - lastSent >= PROGRESS_INTERVAL_MS || progress >= 100) {
          lastSent = now;
          setUploadProgress({ workspaceName, fileId, progress });
        }
      };

      if (file.size <= CHUNK_SIZE) {
        const uploadUrl = await generateUploadUrl({ workspaceName });
        const { storageId } = await withRetry(
          () => uploadWithProgress(uploadUrl, file, contentType, report),
          CHUNK_RETRIES
        );
        await finishUpload({ workspaceName, fileId, storageId });
        return;
      }

      // Chunked: upload each slice as its own blob and record it in order; the
      // server stitches them together once every chunk has landed.
      let uploadedBytes = 0;
      for (let start = 0; start < file.size; start += CHUNK_SIZE) {
        const chunk = file.slice(start, start + CHUNK_SIZE);
        const chunkBase = uploadedBytes;
        const uploadUrl = await generateUploadUrl({ workspaceName });
        const { storageId } = await withRetry(
          () =>
            uploadWithProgress(
              uploadUrl,
              chunk,
              'application/octet-stream',
              (loaded) => report(chunkBase + loaded)
            ),
          CHUNK_RETRIES
        );
        await addChunk({ workspaceName, fileId, storageId });
        uploadedBytes += chunk.size;
        report(uploadedBytes);
      }
      await finishUpload({ workspaceName, fileId });
    } catch (err) {
      // Drop the stuck `uploading` row (and its chunk blobs).
      await cancelUpload({ workspaceName, fileId }).catch(() => {});
      throw err;
    }
  }

  async function uploadFiles(fileList: FileList) {
    const files = Array.from(fileList);
    try {
      for (const file of files) {
        await uploadOne(file);
      }
    } catch (err) {
      let title = 'Could not upload. Please try again.';
      if (err instanceof ConvexError && typeof err.data === 'string') {
        title = err.data;
      } else if (err instanceof Error) {
        title = err.message;
      }
      toast.add({ type: 'error', title });
    } finally {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type='file'
        multiple
        className='hidden'
        onChange={(e) => {
          const { files } = e.target;
          if (files && files.length > 0) {
            uploadFiles(files);
          }
        }}
      />
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        <UploadIcon />
        {children ?? 'Upload'}
      </Button>
    </>
  );
}
