import { AudioFrame } from '@livekit/rtc-node';
import { DeepgramSTT, LiveStreamHandle } from '../ai/DeepgramSTT.js';
import { ClaudeHaiku } from '../ai/ClaudeHaiku.js';
import { CartesiaTTS } from '../ai/CartesiaTTS.js';
import { VoiceInterceptor } from './VoiceInterceptor.js';
import type { LiveKitManager } from './LiveKitManager.js';
import type { VoiceProfileStore } from './VoiceProfileStore.js';

interface PuzzleContext {
  puzzleType: string;
  targetValue?: number;
  currentRound: number;
  maxRounds: number;
}

interface MonitoringSession {
  playerIds: string[];
  playerStreams: Map<string, LiveStreamHandle>;
  conversationHistory: string[];
  interceptor: VoiceInterceptor;
  puzzleContextProvider: () => PuzzleContext | null;
  active: boolean;
}

export type InterceptCallback = (roomId: string, targetPlayerId: string, active: boolean) => void;

export class LeviathanPipeline {
  private stt: DeepgramSTT;
  private llm: ClaudeHaiku;
  private tts: CartesiaTTS;
  private livekitManager: LiveKitManager;
  private voiceProfileStore?: VoiceProfileStore;
  private sessions = new Map<string, MonitoringSession>();
  private onIntercept?: InterceptCallback;

  constructor(livekitManager: LiveKitManager, voiceProfileStore?: VoiceProfileStore) {
    this.stt = new DeepgramSTT();
    this.llm = new ClaudeHaiku();
    this.tts = new CartesiaTTS();
    this.livekitManager = livekitManager;
    this.voiceProfileStore = voiceProfileStore;
  }

  setVoiceProfileStore(store: VoiceProfileStore): void {
    this.voiceProfileStore = store;
  }

  setOnIntercept(callback: InterceptCallback): void {
    this.onIntercept = callback;
  }

  async cloneVoice(calibrationAudio: Buffer): Promise<string> {
    return await this.tts.createVoiceClone(calibrationAudio);
  }

  async startMonitoring(
    roomId: string,
    playerIds: string[],
    puzzleContextProvider: () => PuzzleContext | null,
  ): Promise<void> {
    if (this.sessions.has(roomId)) {
      console.log(`[LeviathanPipeline] Already monitoring room ${roomId}`);
      return;
    }

    const session: MonitoringSession = {
      playerIds,
      playerStreams: new Map(),
      conversationHistory: [],
      interceptor: new VoiceInterceptor(),
      puzzleContextProvider,
      active: true,
    };
    this.sessions.set(roomId, session);

    // Join the LiveKit room as hidden participant
    await this.livekitManager.joinRoomAsLeviathan(roomId);

    // Start STT streams and subscribe to audio for each player
    for (const playerId of playerIds) {
      this.startPlayerMonitoring(roomId, playerId, session);
    }

    console.log(`[LeviathanPipeline] Monitoring started for room ${roomId}`);
  }

  private startPlayerMonitoring(
    roomId: string,
    playerId: string,
    session: MonitoringSession,
  ): void {
    // Start a Deepgram live stream for this player
    const streamHandle = this.stt.startStream((transcript, isFinal) => {
      if (!session.active) return;

      if (isFinal && transcript.trim()) {
        this.onTranscriptReceived(roomId, playerId, transcript, session);
      }
    });

    session.playerStreams.set(playerId, streamHandle);

    // Subscribe to this player's audio and feed it to STT
    // Collect audio frames into buffers for STT
    let audioBuffer: Int16Array[] = [];
    let bufferSamples = 0;
    const CHUNK_SIZE = 48000 * 0.1; // 100ms chunks at 48kHz

    this.livekitManager.subscribeToPlayerAudio(roomId, playerId, (frame: AudioFrame) => {
      if (!session.active) return;

      audioBuffer.push(new Int16Array(frame.data));
      bufferSamples += frame.samplesPerChannel;

      // Send in chunks to Deepgram
      if (bufferSamples >= CHUNK_SIZE) {
        const totalLength = audioBuffer.reduce((acc, buf) => acc + buf.length, 0);
        const combined = new Int16Array(totalLength);
        let offset = 0;
        for (const buf of audioBuffer) {
          combined.set(buf, offset);
          offset += buf.length;
        }

        // Convert Int16Array to Buffer for Deepgram
        const pcmBuffer = Buffer.from(combined.buffer, combined.byteOffset, combined.byteLength);
        streamHandle.feedAudio(pcmBuffer);

        audioBuffer = [];
        bufferSamples = 0;
      }
    });
  }

  private async onTranscriptReceived(
    roomId: string,
    playerId: string,
    transcript: string,
    session: MonitoringSession,
  ): Promise<void> {
    console.log(`[LeviathanPipeline] ${playerId}: "${transcript}"`);
    session.conversationHistory.push(transcript);

    // Keep conversation history manageable
    if (session.conversationHistory.length > 20) {
      session.conversationHistory.splice(0, session.conversationHistory.length - 20);
    }

    const puzzleContext = session.puzzleContextProvider();

    // Analyze whether this is a good moment to intercept
    const analysis = await this.llm.analyzeConversation(session.conversationHistory);

    const shouldIntercept = session.interceptor.shouldIntercept(
      puzzleContext?.currentRound ?? 1,
      analysis,
    );

    if (shouldIntercept) {
      await this.executeInterception(roomId, playerId, transcript, session, puzzleContext);
    }
  }

  private async executeInterception(
    roomId: string,
    playerId: string,
    transcript: string,
    session: MonitoringSession,
    puzzleContext: PuzzleContext | null,
  ): Promise<void> {
    console.log(`[LeviathanPipeline] *** INTERCEPTING ${playerId} in room ${roomId} ***`);

    try {
      // 1. Generate deceptive text
      const deceptiveText = await this.llm.generateDeception(
        transcript,
        puzzleContext ?? undefined,
      );
      if (!deceptiveText) {
        console.log('[LeviathanPipeline] Deception generation failed, aborting intercept');
        return;
      }

      // 2. Get the player's cloned voice
      const voiceId = this.voiceProfileStore?.get(playerId);
      if (!voiceId) {
        console.log(`[LeviathanPipeline] No voice profile for ${playerId}, aborting intercept`);
        return;
      }

      // 3. Synthesize deceptive audio with cloned voice
      const synthAudio = await this.tts.synthesize(deceptiveText, voiceId);

      // 4. Notify clients that interception is active
      this.onIntercept?.(roomId, playerId, true);

      // 5. Mute the real player temporarily
      await this.livekitManager.mutePlayer(roomId, playerId, true);

      // 6. Publish the deceptive audio
      await this.livekitManager.publishAudio(roomId, synthAudio);

      // 7. Unmute the real player and notify clients after audio finishes
      const audioDurationMs = (synthAudio.byteLength / 2 / 48000) * 1000; // PCM s16le at 48kHz
      setTimeout(async () => {
        try {
          await this.livekitManager.mutePlayer(roomId, playerId, false);
          this.onIntercept?.(roomId, playerId, false);
        } catch (err) {
          console.error(`[LeviathanPipeline] Failed to unmute ${playerId}:`, err);
        }
      }, audioDurationMs + 500);

      // Record the interception
      session.interceptor.recordIntercept();

      console.log(`[LeviathanPipeline] Interception complete: "${deceptiveText}"`);
    } catch (err) {
      console.error('[LeviathanPipeline] Interception failed:', err);
      // Ensure player is unmuted on failure
      await this.livekitManager.mutePlayer(roomId, playerId, false);
    }
  }

  resetRound(roomId: string): void {
    const session = this.sessions.get(roomId);
    if (!session) return;

    session.interceptor.resetRound();

    // Restart STT streams (Deepgram closes them between rounds)
    for (const [, stream] of session.playerStreams) {
      stream.stop();
    }
    session.playerStreams.clear();

    for (const playerId of session.playerIds) {
      this.startPlayerMonitoring(roomId, playerId, session);
    }

    console.log(`[LeviathanPipeline] Round reset for room ${roomId}, STT streams restarted`);
  }

  async stopMonitoring(roomId: string): Promise<void> {
    const session = this.sessions.get(roomId);
    if (!session) return;

    session.active = false;

    // Ensure all players are unmuted before leaving
    for (const playerId of session.playerIds) {
      try {
        await this.livekitManager.mutePlayer(roomId, playerId, false);
      } catch (err) {
        console.error(`[LeviathanPipeline] Failed to unmute ${playerId} on stop:`, err);
      }
    }

    // Stop all STT streams
    for (const [playerId, stream] of session.playerStreams) {
      stream.stop();
      console.log(`[LeviathanPipeline] Stopped STT stream for ${playerId}`);
    }

    // Leave the LiveKit room
    await this.livekitManager.leaveRoom(roomId);

    this.sessions.delete(roomId);
    console.log(`[LeviathanPipeline] Monitoring stopped for room ${roomId}`);
  }
}
