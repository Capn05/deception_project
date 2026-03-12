import { GamePhase, PlayerRole, RoomState } from './game.js';

// ── Client → Server ──

export interface CreateRoomMessage {
  type: 'CREATE_ROOM';
}

export interface JoinRoomMessage {
  type: 'JOIN_ROOM';
  roomId: string;
}

export interface ReadyMessage {
  type: 'READY';
}

export interface PuzzleActionMessage {
  type: 'PUZZLE_ACTION';
  action: string;
  value: number;
}

export interface CalibrationCompleteMessage {
  type: 'CALIBRATION_COMPLETE';
}

export interface FindGameMessage {
  type: 'FIND_GAME';
}

export interface CancelFindGameMessage {
  type: 'CANCEL_FIND_GAME';
}

export type ClientMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | ReadyMessage
  | PuzzleActionMessage
  | CalibrationCompleteMessage
  | FindGameMessage
  | CancelFindGameMessage;

// ── Server → Client ──

export interface ConnectedMessage {
  type: 'CONNECTED';
  playerId: string;
}

export interface RoomCreatedMessage {
  type: 'ROOM_CREATED';
  roomId: string;
}

export interface RoomJoinedMessage {
  type: 'ROOM_JOINED';
  roomId: string;
  role: PlayerRole;
}

export interface PartnerConnectedMessage {
  type: 'PARTNER_CONNECTED';
}

export interface PartnerDisconnectedMessage {
  type: 'PARTNER_DISCONNECTED';
}

export interface PhaseChangeMessage {
  type: 'PHASE_CHANGE';
  phase: GamePhase;
}

export interface PuzzleStateMessage {
  type: 'PUZZLE_STATE';
  puzzleType: string;
  state: Record<string, unknown>;
}

export interface PuzzleResultMessage {
  type: 'PUZZLE_RESULT';
  correct: boolean;
  targetValue: number;
  submittedValue: number;
  tolerance: number;
}

export interface TimerUpdateMessage {
  type: 'TIMER_UPDATE';
  remaining: number;
}

export interface ErrorMessage {
  type: 'ERROR';
  message: string;
}

export interface QueueStatusMessage {
  type: 'QUEUE_STATUS';
  searching: boolean;
}

export interface LeviathanInterceptMessage {
  type: 'LEVIATHAN_INTERCEPT';
  targetPlayerId: string;
  active: boolean;
}

export type ServerMessage =
  | ConnectedMessage
  | RoomCreatedMessage
  | RoomJoinedMessage
  | PartnerConnectedMessage
  | PartnerDisconnectedMessage
  | PhaseChangeMessage
  | PuzzleStateMessage
  | PuzzleResultMessage
  | TimerUpdateMessage
  | ErrorMessage
  | QueueStatusMessage
  | LeviathanInterceptMessage;
