import { Card } from '@/components/ui/card';

type OverviewStatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
};

/** A single metric tile on the workspace overview: label + big value + a small
 * supporting line, with an icon in the corner. */
export function OverviewStatCard({
  label,
  value,
  sub,
  icon,
}: OverviewStatCardProps) {
  return (
    <Card className='from-card to-muted gap-0 bg-gradient-to-b p-4'>
      <div className='flex items-center justify-between'>
        <span className='text-muted-foreground text-xs font-medium'>
          {label}
        </span>
        <span className='text-muted-foreground [&_svg]:size-4'>{icon}</span>
      </div>
      <span className='mt-2 text-2xl font-semibold tracking-tight tabular-nums'>
        {value}
      </span>
      {sub && (
        <span className='text-muted-foreground mt-1 truncate text-xs'>
          {sub}
        </span>
      )}
    </Card>
  );
}
