import { PlayerRole, VALVE_COUNT } from '@abyssal-echo/shared';

export class ValveRoutePuzzle {
  private targetStates: Record<number, boolean>;
  private currentValves: { id: number; isOpen: boolean }[];

  constructor() {
    this.targetStates = {};
    this.currentValves = [];

    for (let i = 1; i <= VALVE_COUNT; i++) {
      // ~half valves should be open
      this.targetStates[i] = Math.random() < 0.5;
      this.currentValves.push({ id: i, isOpen: false });
    }
  }

  getStateForRole(role: PlayerRole): Record<string, unknown> {
    if (role === PlayerRole.Observer) {
      return {
        targetStates: this.targetStates,
        valveCount: VALVE_COUNT,
      };
    }
    // Operator sees current valve states but NOT the target
    return {
      valves: this.currentValves.map((v) => ({ ...v })),
      valveCount: VALVE_COUNT,
    };
  }

  toggleValve(id: number): boolean {
    const valve = this.currentValves.find((v) => v.id === id);
    if (!valve) return false;
    valve.isOpen = !valve.isOpen;
    return true;
  }

  checkAnswer(): { correct: boolean; correctCount: number; totalCount: number } {
    let correctCount = 0;
    for (const valve of this.currentValves) {
      if (valve.isOpen === this.targetStates[valve.id]) {
        correctCount++;
      }
    }
    return {
      correct: correctCount === VALVE_COUNT,
      correctCount,
      totalCount: VALVE_COUNT,
    };
  }

  getCurrentValves(): { id: number; isOpen: boolean }[] {
    return this.currentValves.map((v) => ({ ...v }));
  }

  getTargetStates(): Record<number, boolean> {
    return { ...this.targetStates };
  }
}
