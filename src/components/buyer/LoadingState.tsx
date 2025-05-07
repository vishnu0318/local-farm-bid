
import { Loader2 } from 'lucide-react';

export const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
      <p className="text-gray-500">Loading your bids...</p>
    </div>
  );
};
