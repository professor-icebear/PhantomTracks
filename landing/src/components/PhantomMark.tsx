import { cn } from "@/lib/utils";

export const PhantomMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 24" fill="none" className={cn("h-5 w-auto", className)} aria-hidden>
    <path
      d="M2 16 Q 8 6, 14 14 T 26 14 Q 32 6, 38 16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="14" cy="14" r="1.5" fill="currentColor" />
    <circle cx="26" cy="14" r="1.5" fill="currentColor" />
  </svg>
);