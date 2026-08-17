import { cn } from "@/lib/utils";

/**
 * Placeholder college logo mark. Replace the inner block with an <img>
 * pointing at the real college crest when it is available.
 */
export function CollegeLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-primary text-[10px] font-semibold tracking-wider text-primary-foreground",
        className,
      )}
      aria-label="College logo placeholder"
    >
      LOGO
    </div>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <CollegeLogo />
      <div className="leading-tight">
        <div className="font-serif text-base font-bold">SmartFilter</div>
        {!compact && (
          <div className="text-xs text-muted-foreground">Department of AI &amp; Data Science</div>
        )}
      </div>
    </div>
  );
}
