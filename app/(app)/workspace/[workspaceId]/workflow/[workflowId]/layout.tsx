import { WorkflowHeaderActions } from './_components/workflow-header/workflow-header-actions';
import { WorkflowTabs } from './_components/workflow-header/workflow-tabs';

type WorkflowLayoutProps = {
  children: React.ReactNode;
};

export default function WorkflowLayout({ children }: WorkflowLayoutProps) {
  return (
    <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
      <div
        className='bg-background flex h-13 shrink-0 items-center justify-between
          border-b px-2'
      >
        <WorkflowTabs />
        <WorkflowHeaderActions />
      </div>

      {children}
    </div>
  );
}
