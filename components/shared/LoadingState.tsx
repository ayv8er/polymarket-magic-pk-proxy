import { LOADING_STYLES } from "@/constants/ui";

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({
  message = "Loading...",
}: LoadingStateProps) {
  return (
    <div className="text-center py-8">
      <div className={LOADING_STYLES}>{message}</div>
    </div>
  );
}
