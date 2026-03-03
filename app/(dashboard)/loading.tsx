export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-44 rounded-md bg-muted" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
      </div>
      <div className="h-28 rounded-xl bg-muted" />
      <div className="h-44 rounded-xl bg-muted" />
      <div className="h-44 rounded-xl bg-muted" />
    </div>
  );
}
