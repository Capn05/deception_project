import { useGameStore } from './state/gameStore';
import { GamePhase } from '@abyssal-echo/shared';
import { LobbyScreen } from './components/lobby/LobbyScreen';
import { SubmarineHUD } from './components/hud/SubmarineHUD';
import { useGameSocket } from './hooks/useGameSocket';

export default function App() {
  useGameSocket();
  const phase = useGameStore((s) => s.phase);

  switch (phase) {
    case GamePhase.Lobby:
      return <LobbyScreen />;
    case GamePhase.Calibration:
    case GamePhase.Playing:
    case GamePhase.RoundEnd:
    case GamePhase.GameOver:
      return <SubmarineHUD />;
    default:
      return <LobbyScreen />;
  }
}
