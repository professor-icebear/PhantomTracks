import { cn } from "@/lib/utils";

export const SectionLabel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn("font-mono-ui text-muted-foreground", className)}>
    {children}
  </span>
);