import { usePuzzleStore } from '../state/puzzleStore';

export function usePuzzleState() {
  const puzzleType = usePuzzleStore((s) => s.puzzleType);
  const puzzleData = usePuzzleStore((s) => s.puzzleData);
  const lastResult = usePuzzleStore((s) => s.lastResult);

  return { puzzleType, puzzleData, lastResult };
}
