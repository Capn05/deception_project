import {
  PlayerRole,
  WireColor,
  WirePort,
  WireSequenceCutChart,
  WireSequenceState,
  WIRE_SEQUENCE_COUNT,
  WIRE_SEQUENCE_MAX_STRIKES,
} from '@abyssal-echo/shared';

const COLORS: WireColor[] = ['RED', 'BLUE', 'BLACK'];
const PORTS: WirePort[] = ['A', 'B', 'C'];

const CUT_CHART: WireSequenceCutChart = {
  RED: {
    1: { A: true,  B: false, C: true  },
    2: { A: false, B: true,  C: false },
    3: { A: true,  B: true,  C: false },
    4: { A: true,  B: false, C: true  },
  },
  BLUE: {
    1: { A: false, B: true,  C: false },
    2: { A: true,  B: false, C: true  },
    3: { A: false, B: false, C: true  },
    4: { A: true,  B: true,  C: false },
  },
  BLACK: {
    1: { A: false, B: false, C: true  },
    2: { A: true,  B: false, C: false },
    3: { A: false, B: true,  C: true  },
    4: { A: true,  B: true,  C: false },
  },
};

interface Wire {
  color: WireColor;
  port: WirePort;
}

export class WireSequencePuzzle {
  private wires: Wire[];
  private currentIndex: number = 0;
  private colorCounts: Record<WireColor, number> = { RED: 0, BLUE: 0, BLACK: 0 };
  private wiresProcessed: number = 0;
  private strikes: number = 0;
  private completed: boolean = false;

  constructor() {
    this.wires = this.generateWires();
    // Pre-count first wire's color occurrence
    this.colorCounts[this.wires[0].color]++;
  }

  private generateWires(): Wire[] {
    const wires: Wire[] = [];
    const counts: Record<WireColor, number> = { RED: 0, BLUE: 0, BLACK: 0 };

    for (let i = 0; i < WIRE_SEQUENCE_COUNT; i++) {
      // Filter out colors that have already appeared 4 times
      const available = COLORS.filter((c) => counts[c] < 4);
      const color = available[Math.floor(Math.random() * available.length)];
      const port = PORTS[Math.floor(Math.random() * PORTS.length)];
      counts[color]++;
      wires.push({ color, port });
    }

    return wires;
  }

  getStateForRole(role: PlayerRole): Partial<WireSequenceState> {
    const common = {
      totalWires: WIRE_SEQUENCE_COUNT,
      wiresProcessed: this.wiresProcessed,
      strikes: this.strikes,
      maxStrikes: WIRE_SEQUENCE_MAX_STRIKES,
      completed: this.completed,
    };

    if (role === PlayerRole.Observer) {
      return {
        ...common,
        cutChart: CUT_CHART,
      };
    }

    // Operator
    if (this.completed || this.currentIndex >= WIRE_SEQUENCE_COUNT) {
      return common;
    }

    const wire = this.wires[this.currentIndex];
    return {
      ...common,
      currentWire: { color: wire.color, port: wire.port },
      currentWireIndex: this.currentIndex,
      colorOccurrence: this.colorCounts[wire.color],
    };
  }

  decide(shouldCut: boolean): { correct: boolean } {
    if (this.completed || this.currentIndex >= WIRE_SEQUENCE_COUNT) {
      return { correct: false };
    }

    const wire = this.wires[this.currentIndex];
    const occurrence = this.colorCounts[wire.color];
    const expected = CUT_CHART[wire.color][occurrence][wire.port];
    const correct = shouldCut === expected;

    if (!correct) {
      this.strikes++;
      if (this.strikes >= WIRE_SEQUENCE_MAX_STRIKES) {
        this.completed = true;
        return { correct: false };
      }
    }

    // Advance to next wire
    this.wiresProcessed++;
    this.currentIndex++;

    if (this.currentIndex >= WIRE_SEQUENCE_COUNT) {
      this.completed = true;
    } else {
      // Count the next wire's color occurrence
      this.colorCounts[this.wires[this.currentIndex].color]++;
    }

    return { correct };
  }

  isComplete(): boolean {
    return this.completed;
  }

  getResult(): { correct: boolean; wiresProcessed: number; totalWires: number; strikes: number } {
    return {
      correct: this.completed && this.strikes < WIRE_SEQUENCE_MAX_STRIKES,
      wiresProcessed: this.wiresProcessed,
      totalWires: WIRE_SEQUENCE_COUNT,
      strikes: this.strikes,
    };
  }
}
