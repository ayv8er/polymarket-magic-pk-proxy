import { cn } from "@/utils/classNames";
import { CARD_STYLES } from "@/constants/ui";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({
  children,
  className,
  hover = false,
}: CardProps) {
  return (
    <div
      className={cn(
        CARD_STYLES,
        hover && "hover:bg-white/10 transition-colors",
        className
      )}
    >
      {children}
    </div>
  );
}
