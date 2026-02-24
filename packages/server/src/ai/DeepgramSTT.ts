import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import type { ListenLiveClient } from '@deepgram/sdk';

export class DeepgramSTT {
  private client;

  constructor() {
    const key = process.env.DEEPGRAM_API_KEY || '';
    console.log(`[DeepgramSTT] Initialized with key: ${key.slice(0, 8)}...${key.slice(-4)} (${key.length} chars)`);
    this.client = createClient(key);
  }

  async transcribe(audioBuffer: Buffer): Promise<string | null> {
    try {
      const { result, error } = await this.client.listen.prerecorded.transcribeFile(
        audioBuffer,
        { model: 'nova-3', smart_format: true }
      );

      if (error) {
        console.error('[DeepgramSTT] Prerecorded error:', error);
        return null;
      }

      const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || null;
      console.log(`[DeepgramSTT] Prerecorded: "${transcript}"`);
      return transcript;
    } catch (err) {
      console.error('[DeepgramSTT] Prerecorded failed:', err);
      return null;
    }
  }

  startStream(onTranscript: (transcript: string, isFinal: boolean) => void): LiveStreamHandle {
    const connection = this.client.listen.live({
      model: 'nova-3',
      smart_format: true,
      interim_results: true,
      utterance_end_ms: 1000,
      vad_events: true,
      encoding: 'linear16',
      sample_rate: 48000,
      channels: 1,
    });

    let accumulated = '';

    connection.on(LiveTranscriptionEvents.Open, () => {
      console.log('[DeepgramSTT] Live stream opened');
    });

    connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
      const transcript = data.channel?.alternatives?.[0]?.transcript;
      if (!transcript) return;

      if (data.is_final) {
        accumulated += (accumulated ? ' ' : '') + transcript;
        onTranscript(accumulated, false);
      }
    });

    connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
      if (accumulated) {
        onTranscript(accumulated, true);
        accumulated = '';
      }
    });

    connection.on(LiveTranscriptionEvents.Close, (event: any) => {
      console.log(`[DeepgramSTT] Live stream closed`, event?.code ? `code=${event.code} reason=${event.reason}` : '');
    });

    connection.on(LiveTranscriptionEvents.Error, (err: any) => {
      console.error('[DeepgramSTT] Live stream error:', err);
    });

    return new LiveStreamHandle(connection, () => accumulated);
  }
}

export class LiveStreamHandle {
  private frameCount = 0;

  constructor(
    private connection: ListenLiveClient,
    private getAccumulated: () => string,
  ) {}

  feedAudio(data: Buffer): void {
    const state = this.connection.getReadyState();
    if (state === 1) {
      // Convert Buffer to ArrayBuffer for Deepgram's SocketDataLike type
      const ab = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      this.connection.send(ab);
      this.frameCount++;
      if (this.frameCount % 100 === 1) {
        console.log(`[DeepgramSTT] Fed ${this.frameCount} audio chunks (${data.byteLength} bytes each)`);
      }
    } else if (this.frameCount === 0) {
      console.log(`[DeepgramSTT] Dropping audio frame, connection state=${state} (not open yet)`);
    }
  }

  stop(): string {
    const final = this.getAccumulated();
    this.connection.requestClose();
    return final;
  }
}
