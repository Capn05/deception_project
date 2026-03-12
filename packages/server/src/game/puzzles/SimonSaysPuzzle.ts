import {
  PlayerRole,
  SimonColor,
  SimonSaysState,
  SimonColorMappings,
  SIMON_SEQUENCE_LENGTH,
  SIMON_MAX_STRIKES,
} from '@abyssal-echo/shared';

const COLORS: SimonColor[] = ['RED', 'BLUE', 'GREEN', 'YELLOW'];

// KTANE-accurate color mapping tables
const COLOR_MAPPINGS: SimonColorMappings = {
  shallow: {
    0: { RED: 'BLUE', BLUE: 'RED', GREEN: 'YELLOW', YELLOW: 'GREEN' },
    1: { RED: 'YELLOW', BLUE: 'GREEN', GREEN: 'BLUE', YELLOW: 'RED' },
    2: { RED: 'GREEN', BLUE: 'RED', GREEN: 'YELLOW', YELLOW: 'BLUE' },
  },
  deep: {
    0: { RED: 'BLUE', BLUE: 'YELLOW', GREEN: 'GREEN', YELLOW: 'RED' },
    1: { RED: 'RED', BLUE: 'BLUE', GREEN: 'YELLOW', YELLOW: 'GREEN' },
    2: { RED: 'YELLOW', BLUE: 'GREEN', GREEN: 'BLUE', YELLOW: 'RED' },
  },
};

export class SimonSaysPuzzle {
  private fullSequence: SimonColor[];
  private isDeep: boolean;
  private currentStage: number = 1; // 1-based
  private inputProgress: number = 0;
  private strikes: number = 0;
  private completed: boolean = false;

  constructor() {
    // Generate random sequence of SIMON_SEQUENCE_LENGTH colors
    this.fullSequence = Array.from({ length: SIMON_SEQUENCE_LENGTH }, () =>
      COLORS[Math.floor(Math.random() * COLORS.length)]
    );
    this.isDeep = Math.random() < 0.5;
  }

  getStateForRole(role: PlayerRole): Partial<SimonSaysState> {
    const common = {
      strikes: this.strikes,
      maxStrikes: SIMON_MAX_STRIKES,
      totalStages: SIMON_SEQUENCE_LENGTH,
      completed: this.completed,
    };

    if (role === PlayerRole.Observer) {
      return {
        ...common,
        colorMappings: COLOR_MAPPINGS,
      };
    }

    // Operator
    return {
      ...common,
      isDeep: this.isDeep,
      currentFlashSequence: this.fullSequence.slice(0, this.currentStage),
      currentStage: this.currentStage,
      inputProgress: this.inputProgress,
    };
  }

  pressButton(colorIndex: number): { correct: boolean; stageAdvanced: boolean } {
    if (this.completed || this.strikes >= SIMON_MAX_STRIKES) {
      return { correct: false, stageAdvanced: false };
    }

    const flashColor = this.fullSequence[this.inputProgress];
    const strikeCount = Math.min(this.strikes, 2); // Cap at 2 for table lookup
    const mappingTable = this.isDeep
      ? COLOR_MAPPINGS.deep[strikeCount]
      : COLOR_MAPPINGS.shallow[strikeCount];
    const expectedColor = mappingTable[flashColor];
    const pressedColor = COLORS[colorIndex];

    if (pressedColor === expectedColor) {
      this.inputProgress++;

      // Check if completed current stage
      if (this.inputProgress >= this.currentStage) {
        this.inputProgress = 0;

        if (this.currentStage >= SIMON_SEQUENCE_LENGTH) {
          // All stages complete
          this.completed = true;
          return { correct: true, stageAdvanced: true };
        }

        // Advance to next stage
        this.currentStage++;
        return { correct: true, stageAdvanced: true };
      }

      return { correct: true, stageAdvanced: false };
    }

    // Wrong press
    this.strikes++;
    this.inputProgress = 0; // Reset input for current stage

    if (this.strikes >= SIMON_MAX_STRIKES) {
      this.completed = true;
    }

    return { correct: false, stageAdvanced: false };
  }

  isComplete(): boolean {
    return this.completed;
  }

  getResult(): { correct: boolean; stages: number; totalStages: number; strikes: number; maxStrikes: number } {
    return {
      correct: this.completed && this.strikes < SIMON_MAX_STRIKES,
      stages: this.currentStage,
      totalStages: SIMON_SEQUENCE_LENGTH,
      strikes: this.strikes,
      maxStrikes: SIMON_MAX_STRIKES,
    };
  }
}
