import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { redirect } from 'next/navigation';

import { AccountAvatarForm } from './_components/account-avatar-form';
import { AccountNameForm } from './_components/account-name-form';

export default async function AccountSettingsPage() {
  const token = await convexAuthNextjsToken();
  const user = await fetchQuery(api.users.currentUser, {}, { token });

  if (user === null) {
    redirect('/');
  }

  return (
    <div className='flex flex-col gap-8'>
      <div className='flex flex-col gap-1'>
        <h1 className='text-lg font-semibold tracking-tight'>Profile</h1>
        <p className='text-muted-foreground text-[13px]'>
          Manage your name and profile picture.
        </p>
      </div>

      <AccountAvatarForm name={user.name} imageUrl={user.imageUrl} />

      <AccountNameForm name={user.name} />
    </div>
  );
}
