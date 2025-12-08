import { ERROR_STYLES } from "@/constants/ui";

interface ErrorStateProps {
  error: Error | string | unknown;
  title?: string;
}

export default function ErrorState({
  error,
  title = "Error",
}: ErrorStateProps) {
  const errorMessage =
    error instanceof Error ? error.message : String(error || "Unknown error");

  return (
    <div className={ERROR_STYLES}>
      <p className="text-center text-red-300">
        {title}: {errorMessage}
      </p>
    </div>
  );
}
