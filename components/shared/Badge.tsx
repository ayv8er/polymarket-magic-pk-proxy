import { cn } from "@/utils/classNames";

type BadgeVariant = "buy" | "sell" | "closed" | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  buy: "bg-green-500/20 text-green-400 border border-green-500/30",
  sell: "bg-red-500/20 text-red-400 border border-red-500/30",
  closed: "bg-red-500/20 text-red-400",
  default: "bg-blue-500/20 text-blue-300",
};

export default function Badge({
  variant = "default",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "px-3 py-1 rounded text-xs font-bold",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
