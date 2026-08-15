export default function PageBuilderLoading() {
  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      {/* Mirrors the builder toolbar height so the layout doesn't jump. */}
      <div className='h-12 shrink-0 border-b' />
      <div className='bg-canvas relative min-h-0 flex-1 overflow-hidden' />
    </div>
  );
}
