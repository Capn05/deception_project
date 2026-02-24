import { Room, RoomEvent, Track, RemoteTrack, RemoteTrackPublication, RemoteParticipant } from 'livekit-client';

class LiveKitService {
  private room: Room | null = null;
  private connecting = false;
  private onRemoteTrack: ((track: RemoteTrack, participantIdentity: string) => void) | null = null;

  async connect(roomId: string, playerId: string): Promise<Room | null> {
    // Prevent duplicate connections
    if (this.room || this.connecting) {
      console.log('[LiveKit] Already connected or connecting');
      return this.room;
    }

    this.connecting = true;

    try {
      const res = await fetch(`/api/livekit-token?roomId=${roomId}&playerId=${playerId}`);
      const { token, url } = await res.json();

      this.room = new Room();

      this.room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub: RemoteTrackPublication, participant: RemoteParticipant) => {
        console.log('[LiveKit] Track subscribed:', track.kind, 'from', participant.identity);
        if (track.kind === Track.Kind.Audio && this.onRemoteTrack) {
          this.onRemoteTrack(track, participant.identity);
        }
      });

      this.room.on(RoomEvent.Disconnected, () => {
        console.log('[LiveKit] Disconnected from room');
        this.room = null;
        this.connecting = false;
      });

      await this.room.connect(url, token);
      console.log('[LiveKit] Connected to room:', roomId);
      this.connecting = false;
      return this.room;
    } catch (e) {
      console.error('[LiveKit] Connection failed:', e);
      this.room = null;
      this.connecting = false;
      return null;
    }
  }

  async publishMicrophone(): Promise<void> {
    if (!this.room) {
      console.warn('[LiveKit] Cannot publish mic - not connected');
      return;
    }
    await this.room.localParticipant.setMicrophoneEnabled(true);
    console.log('[LiveKit] Microphone enabled');
  }

  async muteMicrophone(): Promise<void> {
    if (!this.room) return;
    await this.room.localParticipant.setMicrophoneEnabled(false);
  }

  setOnRemoteTrack(handler: (track: RemoteTrack, participantIdentity: string) => void) {
    this.onRemoteTrack = handler;
  }

  getRoom(): Room | null {
    return this.room;
  }

  disconnect() {
    this.room?.disconnect();
    this.room = null;
    this.connecting = false;
  }
}

export const livekitService = new LiveKitService();
