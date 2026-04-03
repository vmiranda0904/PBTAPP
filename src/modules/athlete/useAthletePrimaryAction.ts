import { useCallback } from 'react';

type UseAthletePrimaryActionArgs = {
  subscriptionActive: boolean;
  highlightUrl?: string | null;
  onSubscribe: () => void;
  onProcessingPending: () => void;
};

export function useAthletePrimaryAction({
  subscriptionActive,
  highlightUrl,
  onSubscribe,
  onProcessingPending,
}: UseAthletePrimaryActionArgs) {
  return useCallback(() => {
    if (!subscriptionActive) {
      onSubscribe();
      return;
    }

    if (highlightUrl) {
      window.open(highlightUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    onProcessingPending();
  }, [highlightUrl, onProcessingPending, onSubscribe, subscriptionActive]);
}
