import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ResourceTableHeaderProps = {
  /** Column labels: the name column, then the three fixed-width columns. */
  labels: [string, string, string, string];
};

/** The shared column-header row for the workflows and files tables. Kept
 * mounted by each section's layout so it doesn't flash between list pages. */
export function ResourceTableHeader({ labels }: ResourceTableHeaderProps) {
  const [name, second, third, fourth] = labels;
  return (
    <TableHeader>
      <TableRow className='bg-sidebar hover:bg-sidebar'>
        <TableHead
          className='text-muted-foreground h-9 px-5 text-[11px] font-medium
            tracking-wider uppercase'
        >
          {name}
        </TableHead>
        <TableHead
          className='text-muted-foreground h-9 w-[15%] px-5 text-[11px]
            font-medium tracking-wider uppercase'
        >
          {second}
        </TableHead>
        <TableHead
          className='text-muted-foreground h-9 w-[15%] px-5 text-[11px]
            font-medium tracking-wider uppercase'
        >
          {third}
        </TableHead>
        <TableHead
          className='text-muted-foreground h-9 w-[15%] px-5 text-[11px]
            font-medium tracking-wider uppercase'
        >
          {fourth}
        </TableHead>
        <TableHead className='h-9 w-[5%] px-5'>
          <span className='sr-only'>Actions</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
