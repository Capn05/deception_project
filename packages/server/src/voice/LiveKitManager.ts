import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import {
  Room,
  RoomEvent,
  AudioSource,
  AudioFrame,
  LocalAudioTrack,
  AudioStream,
  TrackPublishOptions,
  TrackSource,
} from '@livekit/rtc-node';
import { LEVIATHAN_IDENTITY } from '@abyssal-echo/shared';

const SAMPLE_RATE = 48000;
const NUM_CHANNELS = 1;

interface LeviathanRoom {
  room: Room;
  audioSource: AudioSource;
  audioTrack: LocalAudioTrack;
}

export class LiveKitManager {
  private apiKey: string;
  private apiSecret: string;
  private url: string;
  private httpUrl: string;
  private leviathanRooms = new Map<string, LeviathanRoom>();
  private roomService: RoomServiceClient;

  constructor() {
    this.apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    this.apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
    this.url = process.env.LIVEKIT_URL || 'ws://localhost:7880';
    // RoomServiceClient needs HTTP URL
    this.httpUrl = this.url.replace('ws://', 'http://').replace('wss://', 'https://');
    this.roomService = new RoomServiceClient(this.httpUrl, this.apiKey, this.apiSecret);
  }

  async generateToken(roomId: string, playerId: string): Promise<string> {
    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity: playerId,
    });
    token.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canSubscribe: true,
    });
    return await token.toJwt();
  }

  async generateLeviathanToken(roomId: string): Promise<string> {
    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity: LEVIATHAN_IDENTITY,
    });
    token.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canSubscribe: true,
    });
    return await token.toJwt();
  }

  async joinRoomAsLeviathan(roomId: string, retries = 3): Promise<void> {
    if (this.leviathanRooms.has(roomId)) {
      console.log(`[LiveKitManager] Already in room ${roomId}`);
      return;
    }

    const token = await this.generateLeviathanToken(roomId);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const room = new Room();

        // Create audio source for publishing synthesized audio
        const audioSource = new AudioSource(SAMPLE_RATE, NUM_CHANNELS);
        const audioTrack = LocalAudioTrack.createAudioTrack('leviathan-voice', audioSource);

        await room.connect(this.url, token, { autoSubscribe: true, dynacast: false });
        console.log(`[LiveKitManager] Leviathan joined room ${roomId}`);

        // Publish audio track
        const opts = new TrackPublishOptions({ source: TrackSource.SOURCE_MICROPHONE });
        await room.localParticipant!.publishTrack(audioTrack, opts);

        this.leviathanRooms.set(roomId, { room, audioSource, audioTrack });
        return;
      } catch (err) {
        console.error(`[LiveKitManager] Join attempt ${attempt}/${retries} failed:`, (err as Error).message);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 2000));
        } else {
          throw err;
        }
      }
    }
  }

  subscribeToPlayerAudio(
    roomId: string,
    playerId: string,
    callback: (frame: AudioFrame) => void,
  ): void {
    const entry = this.leviathanRooms.get(roomId);
    if (!entry) {
      console.error(`[LiveKitManager] Not in room ${roomId}`);
      return;
    }

    const { room } = entry;

    // Listen for track subscriptions from the target player
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log(`[LiveKitManager] Track subscribed: identity=${participant.identity}, kind=${track.kind}, looking for=${playerId}`);
      if (participant.identity !== playerId) return;
      if (track.kind !== 1) return; // 1 = KIND_AUDIO

      console.log(`[LiveKitManager] Subscribed to audio from ${playerId}`);
      const stream = new AudioStream(track, SAMPLE_RATE, NUM_CHANNELS);

      (async () => {
        for await (const frame of stream) {
          callback(frame);
        }
      })().catch((err) => {
        console.error(`[LiveKitManager] Audio stream error for ${playerId}:`, err);
      });
    });

    // Check already-subscribed tracks
    console.log(`[LiveKitManager] Checking ${room.remoteParticipants.size} existing participants for ${playerId}`);
    for (const [, participant] of room.remoteParticipants) {
      if (participant.identity !== playerId) continue;
      for (const [, publication] of participant.trackPublications) {
        if (publication.track && publication.track.kind === 1) {
          const stream = new AudioStream(publication.track, SAMPLE_RATE, NUM_CHANNELS);
          (async () => {
            for await (const frame of stream) {
              callback(frame);
            }
          })().catch((err) => {
            console.error(`[LiveKitManager] Audio stream error for ${playerId}:`, err);
          });
        }
      }
    }
  }

  async publishAudio(roomId: string, pcmBuffer: Buffer): Promise<void> {
    const entry = this.leviathanRooms.get(roomId);
    if (!entry) {
      console.error(`[LiveKitManager] Not in room ${roomId}`);
      return;
    }

    const { audioSource } = entry;

    // Convert PCM s16le buffer to Int16Array
    const samples = new Int16Array(
      pcmBuffer.buffer,
      pcmBuffer.byteOffset,
      pcmBuffer.byteLength / 2,
    );
    const samplesPerChannel = samples.length / NUM_CHANNELS;

    const frame = new AudioFrame(samples, SAMPLE_RATE, NUM_CHANNELS, samplesPerChannel);
    await audioSource.captureFrame(frame);

    console.log(`[LiveKitManager] Published ${samplesPerChannel} samples to room ${roomId}`);
  }

  async mutePlayer(roomId: string, playerId: string, muted: boolean): Promise<void> {
    try {
      // Find the player's audio track SID
      const entry = this.leviathanRooms.get(roomId);
      if (!entry) return;

      const participant = entry.room.remoteParticipants.get(playerId);
      if (!participant) return;

      for (const [, pub] of participant.trackPublications) {
        if (pub.track && pub.track.kind === 1) { // 1 = KIND_AUDIO
          await this.roomService.mutePublishedTrack(roomId, playerId, pub.track.sid!, muted);
          console.log(`[LiveKitManager] ${muted ? 'Muted' : 'Unmuted'} player ${playerId}`);
        }
      }
    } catch (err) {
      console.error(`[LiveKitManager] Failed to mute/unmute ${playerId}:`, err);
    }
  }

  async leaveRoom(roomId: string): Promise<void> {
    const entry = this.leviathanRooms.get(roomId);
    if (!entry) return;

    try {
      await entry.audioTrack.close();
      await entry.audioSource.close();
      await entry.room.disconnect();
    } catch (err) {
      console.error(`[LiveKitManager] Error leaving room ${roomId}:`, err);
    }

    this.leviathanRooms.delete(roomId);
    console.log(`[LiveKitManager] Leviathan left room ${roomId}`);
  }

  getUrl(): string {
    return this.url;
  }
}
