export enum GamePhase {
  Lobby = 'LOBBY',
  Calibration = 'CALIBRATION',
  Playing = 'PLAYING',
  RoundEnd = 'ROUND_END',
  GameOver = 'GAME_OVER',
}

export enum PlayerRole {
  Observer = 'OBSERVER',
  Operator = 'OPERATOR',
}

export interface Player {
  id: string;
  role: PlayerRole | null;
  connected: boolean;
}

export interface RoomState {
  roomId: string;
  players: Player[];
  phase: GamePhase;
  currentRound: number;
  maxRounds: number;
}
