'use client';

import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FieldDescription, FieldLabel } from '@/components/ui/field';
import { api } from '@/convex/_generated/api';
import { getInitials } from '@/lib/get-initials';
import { useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';

type AccountAvatarFormProps = {
  name: string;
  imageUrl: string | null;
};

export function AccountAvatarForm({ name, imageUrl }: AccountAvatarFormProps) {
  const generateUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
  const setAvatar = useMutation(api.users.setAvatar);
  const removeAvatar = useMutation(api.users.removeAvatar);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) {
      return;
    }

    setError(null);
    setBusy(true);
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
      await setAvatar({
        storageId: storageId as Parameters<typeof setAvatar>[0]['storageId'],
      });
      router.refresh();
    } catch {
      setError('Could not upload picture. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setBusy(true);
    try {
      await removeAvatar();
      router.refresh();
    } catch {
      setError('Could not remove picture. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className='flex flex-col gap-3'>
      <FieldLabel>Profile picture</FieldLabel>
      <div className='flex items-center gap-4'>
        <Avatar className='size-14'>
          {imageUrl && <AvatarImage src={imageUrl} alt={name} />}
          <AvatarFallback className='text-lg font-semibold'>
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={busy}
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          {busy ? 'Uploading…' : 'Upload'}
        </Button>
        {imageUrl && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            disabled={busy}
            onClick={handleRemove}
          >
            Remove
          </Button>
        )}
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
