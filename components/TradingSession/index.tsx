"use client";

import SessionInfo from "@/components/TradingSession/SessionInfo";
import SessionStatus from "@/components/TradingSession/SessionStatus";
import SessionSuccess from "@/components/TradingSession/SessionSuccess";
import SessionActions from "@/components/TradingSession/SessionActions";
import SessionProgress from "@/components/TradingSession/SessionProgress";

import type {
  TradingSession as TradingSessionType,
  SessionStep,
} from "@/utils/session";

interface Props {
  session: TradingSessionType | null;
  currentStep: SessionStep;
  error: Error | null;
  isComplete: boolean | undefined;
  initialize: () => Promise<void>;
  endSession: () => void;
}

export default function TradingSession({
  session,
  currentStep,
  error,
  isComplete,
  initialize,
  endSession,
}: Props) {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
      <SessionStatus isComplete={isComplete} />
      <SessionInfo isComplete={isComplete} />
      <SessionProgress currentStep={currentStep} />
      {isComplete && session && <SessionSuccess session={session} />}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-4 mb-4">
          <p className="text-sm text-red-300 font-medium mb-2">Error</p>
          <pre className="text-xs text-red-400 whitespace-pre-wrap">
            {error.message}
          </pre>
        </div>
      )}

      <div className="flex gap-3">
        <SessionActions
          isComplete={isComplete}
          currentStep={currentStep}
          onInitialize={initialize}
          onEnd={endSession}
        />
      </div>
    </div>
  );
}
