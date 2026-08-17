'use client';

import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FieldDescription, FieldLabel } from '@/components/ui/field';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';

import type { Id } from '@/convex/_generated/dataModel';

type WorkspaceLogoFormProps = {
  workspaceId: Id<'workspaces'>;
  workspaceName: string;
  imageUrl: string | null;
  isAdmin: boolean;
};

export function WorkspaceLogoForm({
  workspaceId,
  workspaceName,
  imageUrl,
  isAdmin,
}: WorkspaceLogoFormProps) {
  const generateUploadUrl = useMutation(api.workspaces.generateLogoUploadUrl);
  const setLogo = useMutation(api.workspaces.setLogo);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) {
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      const { storageId } = (await response.json()) as { storageId: string };
      await setLogo({
        workspaceId,
        storageId: storageId as Parameters<typeof setLogo>[0]['storageId'],
      });
      router.refresh();
    } catch {
      setError('Could not upload logo. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className='flex flex-col gap-3'>
      <FieldLabel>Workspace logo</FieldLabel>
      <div className='flex items-center gap-4'>
        <Avatar className='size-14 rounded-lg'>
          {imageUrl && <AvatarImage src={imageUrl} alt={workspaceName} />}
          <AvatarFallback className='rounded-lg text-lg font-semibold'>
            {workspaceName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={!isAdmin || uploading}
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          {uploading ? 'Uploading…' : 'Upload logo'}
        </Button>
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          className='hidden'
          onChange={handleFileChange}
        />
      </div>
      <FieldDescription>
        Recommended: a square image, at least 128×128px.
      </FieldDescription>
      {error && (
        <FieldDescription className='text-destructive'>
          {error}
        </FieldDescription>
      )}
    </div>
  );
}
