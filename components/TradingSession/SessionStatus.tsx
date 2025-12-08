import { cn } from "@/utils/classNames";

export default function SessionStatus({
  isComplete,
}: {
  isComplete: boolean | undefined;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold">Trading Session</h3>
      </div>

      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            isComplete ? "bg-green-500" : "bg-gray-500"
          )}
        />
        <span className="text-sm text-gray-300">
          {isComplete ? "Ready to Trade" : "Not Initialized"}
        </span>
      </div>
    </div>
  );
}
