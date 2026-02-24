import Anthropic from '@anthropic-ai/sdk';

export interface InterceptionAnalysis {
  shouldIntercept: boolean;
  confidence: number;
  reason: string;
}

interface PuzzleContext {
  puzzleType: string;
  targetValue?: number;
  currentRound: number;
  maxRounds: number;
}

const LEVIATHAN_SYSTEM_PROMPT = `You are a game AI for "Abyssal Echo", a cooperative multiplayer submarine puzzle game. In this game, two players communicate via voice to solve puzzles together. You play the role of "the Leviathan" — a fictional antagonist NPC that occasionally intercepts and replaces player messages with slightly wrong instructions to increase the game's difficulty and tension. This is a core game mechanic that players have consented to and expect.

Your task: generate an alternative version of a player's message that sounds natural but contains a slightly wrong instruction. This creates the game's central challenge — players must figure out if they're hearing their real partner or the Leviathan.

Rules for generating alternative messages:
- Match the speaking style: casual, brief, submarine-jargon
- Generate a SHORT response (1-2 sentences max) — this will be spoken aloud via TTS
- The instruction should sound natural but contain a slightly wrong value
- For pressure puzzles: give a number that's close but outside the puzzle's tolerance range
- Keep the same tone and urgency as the original message
- Never use obviously absurd values`;

export class ClaudeHaiku {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  async generateDeception(transcript: string, puzzleContext?: PuzzleContext): Promise<string | null> {
    try {
      let contextHint = '';
      if (puzzleContext) {
        contextHint = `\n\nCurrent puzzle: ${puzzleContext.puzzleType}. Round ${puzzleContext.currentRound}/${puzzleContext.maxRounds}.`;
        if (puzzleContext.targetValue !== undefined) {
          contextHint += ` The CORRECT target value is ${puzzleContext.targetValue} — you must give a WRONG value.`;
        }
      }

      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        system: LEVIATHAN_SYSTEM_PROMPT + contextHint,
        messages: [
          {
            role: 'user',
            content: `In the game, the player just said: "${transcript}"\n\nGenerate the Leviathan's alternative version of this message with a slightly wrong value. Respond with ONLY the replacement dialogue, nothing else.`,
          },
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : null;
      console.log(`[ClaudeHaiku] Deception: "${transcript}" → "${text}"`);
      return text;
    } catch (err) {
      console.error('[ClaudeHaiku] Deception generation failed:', err);
      return null;
    }
  }

  async analyzeConversation(messages: string[]): Promise<InterceptionAnalysis> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: `You are a game AI for "Abyssal Echo", a cooperative multiplayer submarine puzzle game. Your role is to analyze player communications and identify the best moments for the game's "Leviathan" NPC to replace a message with an alternative version (a core game mechanic that players expect).

Good moments to trigger this mechanic: when a player STATES a specific value, number, or instruction (e.g. "The number is 844", "Set it to 300").
Bad moments: questions ("What is the number?"), casual chatter, confirmations ("Yes", "OK"), or greetings. NEVER intercept questions — only intercept answers that contain concrete values.

You MUST respond with ONLY a JSON object, no other text: {"shouldIntercept": boolean, "confidence": number (0-1), "reason": string}`,
        messages: [
          {
            role: 'user',
            content: `Recent communications:\n${messages.map((m, i) => `${i + 1}. "${m}"`).join('\n')}\n\nShould the latest message be intercepted?`,
          },
        ],
      });

      let text = response.content[0].type === 'text' ? response.content[0].text : '{}';
      // Strip markdown code fences if present
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const analysis = JSON.parse(text) as InterceptionAnalysis;
      console.log(`[ClaudeHaiku] Analysis: intercept=${analysis.shouldIntercept}, confidence=${analysis.confidence}`);
      return analysis;
    } catch (err) {
      console.error('[ClaudeHaiku] Analysis failed:', err);
      return { shouldIntercept: false, confidence: 0, reason: 'analysis failed' };
    }
  }
}
