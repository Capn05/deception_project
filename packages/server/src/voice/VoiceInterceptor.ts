import {
  LEVIATHAN_COOLDOWN_MS,
  LEVIATHAN_CONTENT_COOLDOWN_MS,
  LEVIATHAN_MAX_INTERCEPTS_PER_ROUND,
  LEVIATHAN_BASE_PROBABILITY,
  LEVIATHAN_PROBABILITY_INCREMENT,
  LEVIATHAN_CONTENT_CONFIDENCE_THRESHOLD,
} from '@abyssal-echo/shared';
import type { InterceptionAnalysis } from '../ai/ClaudeHaiku.js';

export class VoiceInterceptor {
  private lastInterceptTime = 0;
  private interceptCountThisRound = 0;
  private currentRound = 1;

  shouldIntercept(
    roundNumber: number,
    contentAnalysis?: InterceptionAnalysis,
  ): boolean {
    this.currentRound = roundNumber;
    const now = Date.now();
    const timeSinceLastIntercept = now - this.lastInterceptTime;

    // Max intercepts per round
    if (this.interceptCountThisRound >= LEVIATHAN_MAX_INTERCEPTS_PER_ROUND) {
      console.log('[VoiceInterceptor] Max intercepts reached for this round');
      return false;
    }

    // Content-triggered interception (shorter cooldown if Claude is confident)
    if (
      contentAnalysis &&
      contentAnalysis.shouldIntercept &&
      contentAnalysis.confidence >= LEVIATHAN_CONTENT_CONFIDENCE_THRESHOLD
    ) {
      if (timeSinceLastIntercept < LEVIATHAN_CONTENT_COOLDOWN_MS) {
        console.log('[VoiceInterceptor] Content trigger blocked by short cooldown');
        return false;
      }
      console.log(`[VoiceInterceptor] Content-triggered intercept: ${contentAnalysis.reason}`);
      return true;
    }

    // Standard cooldown check
    if (timeSinceLastIntercept < LEVIATHAN_COOLDOWN_MS) {
      return false;
    }

    // Round-escalating probability
    const probability = this.getInterceptProbability(roundNumber);
    const roll = Math.random();
    const shouldIntercept = roll < probability;

    console.log(
      `[VoiceInterceptor] Round ${roundNumber}, probability=${probability.toFixed(2)}, roll=${roll.toFixed(2)}, intercept=${shouldIntercept}`
    );

    return shouldIntercept;
  }

  recordIntercept(): void {
    this.lastInterceptTime = Date.now();
    this.interceptCountThisRound++;
  }

  resetRound(): void {
    this.interceptCountThisRound = 0;
  }

  getInterceptProbability(roundNumber: number): number {
    return Math.min(
      LEVIATHAN_BASE_PROBABILITY + (roundNumber - 1) * LEVIATHAN_PROBABILITY_INCREMENT,
      0.75
    );
  }
}
