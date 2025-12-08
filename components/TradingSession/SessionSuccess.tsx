import type { TradingSession } from "@/utils/session";

export default function SessionSuccess({
  session,
}: {
  session: TradingSession;
}) {
  return (
    <div className="text-sm text-gray-300 bg-green-500/10 border border-green-500/20 rounded p-4 mb-4">
      <div className="text-xs leading-relaxed text-gray-400 space-y-1">
        <ul className="space-y-1 ml-4 list-disc">
          <li>Magic proxy wallet deployed at: {session.proxyAddress}</li>
          <li>CLOB client initialized with user's API credentials</li>
        </ul>
      </div>
    </div>
  );
}
