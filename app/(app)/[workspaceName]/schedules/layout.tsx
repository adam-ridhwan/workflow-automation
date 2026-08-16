import { SchedulesHeader } from './_components/schedules-header';

type SchedulesListLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function SchedulesListLayout({
  children,
}: SchedulesListLayoutProps) {
  return (
    <>
      <SchedulesHeader />
      {children}
    </>
  );
}
