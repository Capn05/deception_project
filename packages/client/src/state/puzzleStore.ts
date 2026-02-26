import { create } from 'zustand';
import { PuzzleType } from '@abyssal-echo/shared';

interface PuzzleState {
  puzzleType: PuzzleType | null;
  puzzleData: Record<string, unknown>;
  lastResult: {
    correct: boolean;
    targetValue: number;
    submittedValue: number;
    tolerance: number;
  } | null;

  setPuzzleState: (type: PuzzleType, data: Record<string, unknown>) => void;
  setResult: (result: PuzzleState['lastResult']) => void;
  reset: () => void;
}

export const usePuzzleStore = create<PuzzleState>((set) => ({
  puzzleType: null,
  puzzleData: {},
  lastResult: null,

  setPuzzleState: (type, data) => set({ puzzleType: type, puzzleData: data }),
  setResult: (result) => set({ lastResult: result }),
  reset: () => set({ puzzleType: null, puzzleData: {}, lastResult: null }),
}));
