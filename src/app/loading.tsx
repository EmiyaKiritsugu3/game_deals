export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="container">
        <div className="flex flex-col items-center gap-6">
          <div className="size-10 animate-spin rounded-full border-[3px] border-border border-t-primary" />
          <p className="text-sm font-medium tracking-wider text-muted-foreground">
            Scanning for discounts...
          </p>
        </div>
      </div>
    </div>
  );
}
