import { useEffect } from 'react';
import { socketService } from '../services/socketService';
import { useGameStore } from '../state/gameStore';
import { usePuzzleStore } from '../state/puzzleStore';
import { PuzzleType } from '@abyssal-echo/shared';

export function useGameSocket() {
  const {
    setPhase, setRole, setRoomId, setPlayerId, setPartnered, setTimerRemaining, setLeviathanActive,
  } = useGameStore();
  const { setPuzzleState, setResult, reset: resetPuzzle } = usePuzzleStore();

  useEffect(() => {
    socketService.connect();

    const unsub = socketService.onMessage((msg) => {
      switch (msg.type) {
        case 'CONNECTED':
          setPlayerId(msg.playerId);
          break;
        case 'ROOM_CREATED':
        case 'ROOM_JOINED':
          setRoomId(msg.roomId);
          if (msg.type === 'ROOM_JOINED') setRole(msg.role);
          break;
        case 'PARTNER_CONNECTED':
          setPartnered(true);
          break;
        case 'PARTNER_DISCONNECTED':
          setPartnered(false);
          break;
        case 'PHASE_CHANGE':
          setPhase(msg.phase);
          if (msg.phase === 'PLAYING') resetPuzzle();
          break;
        case 'PUZZLE_STATE':
          setPuzzleState(msg.puzzleType as PuzzleType, msg.state);
          break;
        case 'PUZZLE_RESULT':
          setResult(msg);
          break;
        case 'TIMER_UPDATE':
          setTimerRemaining(msg.remaining);
          break;
        case 'LEVIATHAN_INTERCEPT':
          console.log(`[Game] Leviathan intercept: target=${msg.targetPlayerId}, active=${msg.active}`);
          setLeviathanActive(msg.active);
          break;
        case 'ERROR':
          console.error('[Game] Error:', msg.message);
          break;
      }
    });

    return () => {
      unsub();
    };
  }, []);
}
