import { create } from 'zustand';
import { GamePhase, PlayerRole } from '@abyssal-echo/shared';

interface GameState {
  phase: GamePhase;
  role: PlayerRole | null;
  roomId: string | null;
  playerId: string | null;
  partnered: boolean;
  battery: number;
  transmitting: boolean;
  receiving: boolean;
  timerRemaining: number;
  leviathanActive: boolean;
  searching: boolean;

  setPhase: (phase: GamePhase) => void;
  setRole: (role: PlayerRole) => void;
  setRoomId: (roomId: string) => void;
  setPlayerId: (playerId: string) => void;
  setPartnered: (partnered: boolean) => void;
  setBattery: (battery: number) => void;
  setTransmitting: (transmitting: boolean) => void;
  setReceiving: (receiving: boolean) => void;
  setTimerRemaining: (remaining: number) => void;
  setLeviathanActive: (active: boolean) => void;
  setSearching: (searching: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  phase: GamePhase.Lobby,
  role: null,
  roomId: null,
  playerId: null,
  partnered: false,
  battery: 100,
  transmitting: false,
  receiving: false,
  timerRemaining: 0,
  leviathanActive: false,
  searching: false,

  setPhase: (phase) => set({ phase }),
  setRole: (role) => set({ role }),
  setRoomId: (roomId) => set({ roomId }),
  setPlayerId: (playerId) => set({ playerId }),
  setPartnered: (partnered) => set({ partnered }),
  setBattery: (battery) => set({ battery }),
  setTransmitting: (transmitting) => set({ transmitting }),
  setReceiving: (receiving) => set({ receiving }),
  setTimerRemaining: (remaining) => set({ timerRemaining: remaining }),
  setLeviathanActive: (active) => set({ leviathanActive: active }),
  setSearching: (searching) => set({ searching }),
  reset: () => set({
    phase: GamePhase.Lobby,
    role: null,
    roomId: null,
    playerId: null,
    partnered: false,
    battery: 100,
    transmitting: false,
    receiving: false,
    timerRemaining: 0,
    leviathanActive: false,
    searching: false,
  }),
}));
