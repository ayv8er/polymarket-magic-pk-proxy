import { SessionStep } from "@/utils/session";

interface SessionActionsProps {
  isComplete: boolean | undefined;
  currentStep: SessionStep;
  onInitialize: () => void;
  onEnd: () => void;
}

export default function SessionActions({
  isComplete,
  currentStep,
  onInitialize,
  onEnd,
}: SessionActionsProps) {
  if (!isComplete) {
    return (
      <button
        onClick={onInitialize}
        disabled={currentStep !== "idle"}
        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded transition-colors"
      >
        {currentStep !== "idle"
          ? "Initializing..."
          : "Initialize Trading Session"}
      </button>
    );
  }

  return (
    <>
      <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded px-4 py-3 flex items-center justify-center">
        <span className="text-green-300 font-medium">Session Active</span>
      </div>
      <button
        onClick={onEnd}
        className="bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium py-3 px-4 rounded transition-colors"
      >
        End Session
      </button>
    </>
  );
}
