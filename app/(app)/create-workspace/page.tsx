import { WorkflowIcon } from 'lucide-react';

import { CreateWorkspaceForm } from './_components/create-workspace-form';

export default function CreateWorkspacePage() {
  return (
    <div
      className='bg-muted flex min-h-svh flex-col items-center justify-center
        gap-6 p-6 md:p-10'
    >
      <div className='flex w-full max-w-sm flex-col gap-6'>
        <div className='flex items-center gap-2 self-center font-medium'>
          <div
            className='bg-primary text-primary-foreground flex size-6
              items-center justify-center rounded-md'
          >
            <WorkflowIcon className='size-4' />
          </div>
          AI Workflow Builder
        </div>
        <CreateWorkspaceForm />
      </div>
    </div>
  );
}
