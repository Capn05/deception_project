export const VOICE_DELAY_MS = 3500;
export const BATTERY_MAX = 100;
export const BATTERY_DRAIN_RATE = 2;       // per second while transmitting
export const BATTERY_RECHARGE_RATE = 1;    // per second while not transmitting
export const PRESSURE_MIN = 100;
export const PRESSURE_MAX = 999;
export const PRESSURE_TOLERANCE = 25;
export const PUZZLE_TIME_LIMIT = 60;       // seconds
export const MAX_ROUNDS = 5;
export const CALIBRATION_DURATION = 10;    // seconds
export const ROOM_CODE_LENGTH = 4;
export const MAX_PLAYERS_PER_ROOM = 2;
export const BITCRUSHER_BIT_DEPTH = 6;
export const BITCRUSHER_FREQUENCY_REDUCTION = 8;
export const LOWPASS_FREQUENCY = 2200;
export const HIGHPASS_FREQUENCY = 300;
export const RADIO_DISTORTION_GAIN = 8;
export const RADIO_NOISE_LEVEL = 0.003;

// Leviathan AI Pipeline
export const LEVIATHAN_COOLDOWN_MS = 45_000;           // min 45s between interceptions
export const LEVIATHAN_CONTENT_COOLDOWN_MS = 20_000;   // shorter cooldown for high-confidence content triggers
export const LEVIATHAN_MAX_INTERCEPTS_PER_ROUND = 2;
export const LEVIATHAN_BASE_PROBABILITY = 0.15;        // 15% in round 1
export const LEVIATHAN_PROBABILITY_INCREMENT = 0.10;   // +10% per round → 55% in round 5
export const LEVIATHAN_CONTENT_CONFIDENCE_THRESHOLD = 0.7;
export const LEVIATHAN_IDENTITY = 'leviathan';         // hidden participant identity
export const VALVE_COUNT = 6;
