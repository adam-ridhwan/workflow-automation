import { WorkflowsHeader } from './_components/workflows-header';

type WorkflowsLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function WorkflowsLayout({ children }: WorkflowsLayoutProps) {
  return (
    <>
      <WorkflowsHeader />
      {children}
    </>
  );
}
