'use client';

import { useRef, useState } from 'react';
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

type UploadButtonProps = {
  /** Upload destination; omit to upload to the workspace root. */
  folderId?: Folder['_id'];
  variant?: ComponentProps<typeof Button>['variant'];
  size?: ComponentProps<typeof Button>['size'];
  className?: string;
  children?: React.ReactNode;
};

/** POST one file's bytes to a Convex upload URL, reporting transfer progress.
 * Uses XHR because fetch can't observe upload progress. Resolves to the
 * `storageId` for the stored blob. */
function uploadWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress: (loadedBytes: number) => void
) {
  return new Promise<{ storageId: Id<'_storage'> }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded);
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
    xhr.send(file);
  });
}

/** Uploads one or more files with a live transfer percentage: fetches a
 * per-file upload URL, streams the bytes to Convex storage (tracking progress),
 * then records each as a `files` row. The reactive files list picks up the new
 * rows and their indexing progress automatically. Shared by the files header
 * and the empty state. */
export function UploadButton({
  folderId,
  variant,
  size = 'sm',
  className = 'h-8',
  children,
}: UploadButtonProps) {
  const { workspaceName } = useWorkspaceParams();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createFile = useMutation(api.files.create);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [percent, setPercent] = useState(0);

  async function uploadFiles(fileList: FileList) {
    const files = Array.from(fileList);
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0) || 1;
    let bytesBefore = 0;

    setUploading(true);
    setPercent(0);
    try {
      for (const file of files) {
        const contentType = file.type || 'application/octet-stream';
        const uploadUrl = await generateUploadUrl({ workspaceName });
        const { storageId } = await uploadWithProgress(
          uploadUrl,
          file,
          contentType,
          (loaded) => {
            setPercent(Math.round(((bytesBefore + loaded) / totalBytes) * 100));
          }
        );
        bytesBefore += file.size;
        setPercent(Math.round((bytesBefore / totalBytes) * 100));
        await createFile({
          workspaceName,
          name: file.name,
          storageId,
          size: file.size,
          contentType,
          folderId,
        });
      }
      toast.add({
        type: 'success',
        title:
          files.length === 1
            ? 'File uploaded.'
            : `${files.length} files uploaded.`,
      });
    } catch (err) {
      toast.add({
        type: 'error',
        title:
          err instanceof ConvexError && typeof err.data === 'string'
            ? err.data
            : err instanceof Error
              ? err.message
              : 'Could not upload. Please try again.',
      });
    } finally {
      setUploading(false);
      setPercent(0);
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
        onChange={(event) => {
          const { files } = event.target;
          if (files && files.length > 0) {
            uploadFiles(files);
          }
        }}
      />
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={uploading}
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        <UploadIcon />
        {uploading ? `Uploading ${percent}%` : (children ?? 'Upload')}
      </Button>
    </>
  );
}
