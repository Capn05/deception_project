import { CartesiaClient } from '@cartesia/cartesia-js';
import type { Readable } from 'stream';

export class CartesiaTTS {
  private client: CartesiaClient;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.CARTESIA_API_KEY || '';
    this.client = new CartesiaClient({
      apiKey: this.apiKey,
    });
  }

  async createVoiceClone(audioSample: Buffer): Promise<string> {
    // Step 1: Get voice embedding from audio clip
    const formData = new FormData();
    const blob = new Blob([audioSample], { type: 'audio/webm' });
    formData.append('clip', blob, 'calibration.webm');
    formData.append('mode', 'similarity');
    formData.append('language', 'en');

    const clipRes = await fetch('https://api.cartesia.ai/voices/clone/clip', {
      method: 'POST',
      headers: {
        'Cartesia-Version': '2024-06-10',
        'X-API-Key': this.apiKey,
      },
      body: formData,
    });

    if (!clipRes.ok) {
      const body = await clipRes.text();
      throw new Error(`Cartesia clip clone failed (${clipRes.status}): ${body}`);
    }

    const { embedding } = await clipRes.json() as { embedding: number[] };
    console.log(`[CartesiaTTS] Got voice embedding (${embedding.length} dims)`);

    // Step 2: Create a voice with that embedding
    const voiceRes = await fetch('https://api.cartesia.ai/voices', {
      method: 'POST',
      headers: {
        'Cartesia-Version': '2024-06-10',
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `leviathan-clone-${Date.now()}`,
        description: 'Abyssal Echo voice clone',
        embedding,
        language: 'en',
      }),
    });

    if (!voiceRes.ok) {
      const body = await voiceRes.text();
      throw new Error(`Cartesia voice creation failed (${voiceRes.status}): ${body}`);
    }

    const voice = await voiceRes.json() as { id: string };
    console.log(`[CartesiaTTS] Voice created: ${voice.id}`);
    return voice.id;
  }

  async synthesize(text: string, voiceId: string): Promise<Buffer> {
    const stream: Readable = await this.client.tts.bytes({
      modelId: 'sonic-2',
      transcript: text,
      voice: {
        mode: 'id',
        id: voiceId,
      },
      outputFormat: {
        container: 'raw',
        encoding: 'pcm_s16le',
        sampleRate: 48000,
      },
      language: 'en',
    });

    // Collect readable stream into buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const pcmBuffer = Buffer.concat(chunks);

    console.log(`[CartesiaTTS] Synthesized ${text.length} chars → ${pcmBuffer.byteLength} bytes PCM`);
    return pcmBuffer;
  }
}
