export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-6 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-primary" />
        <p className="text-sm font-medium tracking-wide text-muted-foreground">Scanning for discounts...</p>
      </div>
    </div>
  );
}
