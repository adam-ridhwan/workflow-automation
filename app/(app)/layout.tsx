import { AppSidebar } from '@/app/(app)/_components/app-sidebar';
import { PendingWorkspaceCreator } from '@/app/(app)/_components/pending-workspace-creator';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

type AppLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <PendingWorkspaceCreator />
        <AppSidebar />

        <SidebarInset>
          <header
            className='flex h-16 shrink-0 items-center gap-2
              transition-[width,height] ease-linear
              group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'
          >
            <div className='flex items-center gap-2 px-4'>
              <SidebarTrigger className='-ml-1' />

              <Separator
                orientation='vertical'
                className='mr-2 data-vertical:h-4 data-vertical:self-auto'
              />
            </div>
          </header>

          <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
