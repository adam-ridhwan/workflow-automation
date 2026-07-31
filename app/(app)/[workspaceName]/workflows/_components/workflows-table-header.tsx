import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function WorkflowsTableHeader() {
  return (
    <TableHeader>
      <TableRow className='bg-sidebar hover:bg-sidebar'>
        <TableHead
          className='text-muted-foreground h-9 px-5 text-[11px] font-medium
            tracking-wider uppercase'
        >
          Name
        </TableHead>

        <TableHead
          className='text-muted-foreground h-9 w-[15%] px-5 text-[11px]
            font-medium tracking-wider uppercase'
        >
          Status
        </TableHead>

        <TableHead
          className='text-muted-foreground h-9 w-[15%] px-5 text-[11px]
            font-medium tracking-wider uppercase'
        >
          Created
        </TableHead>

        <TableHead
          className='text-muted-foreground h-9 w-[15%] px-5 text-[11px]
            font-medium tracking-wider uppercase'
        >
          Owner
        </TableHead>

        <TableHead className='h-9 w-[5%] px-5'>
          <span className='sr-only'>Actions</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
