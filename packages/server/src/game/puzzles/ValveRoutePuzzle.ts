import { PlayerRole, VALVE_COUNT } from '@abyssal-echo/shared';

export class ValveRoutePuzzle {
  private targetStates: Record<number, boolean>;
  private currentValves: { id: number; isOpen: boolean }[];

  constructor() {
    this.targetStates = {};
    this.currentValves = [];

    // Create valve IDs and shuffle their display order
    const ids = Array.from({ length: VALVE_COUNT }, (_, i) => i + 1);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }

    for (const id of ids) {
      // ~half valves should be open as target
      this.targetStates[id] = Math.random() < 0.5;
      // Randomize initial valve state for operator
      this.currentValves.push({ id, isOpen: Math.random() < 0.5 });
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
