export class VoiceProfileStore {
  private profiles = new Map<string, string>();

  set(playerId: string, voiceId: string): void {
    this.profiles.set(playerId, voiceId);
    console.log(`[VoiceProfileStore] Stored voice profile for ${playerId}: ${voiceId}`);
  }

  get(playerId: string): string | undefined {
    return this.profiles.get(playerId);
  }

  has(playerId: string): boolean {
    return this.profiles.has(playerId);
  }

  delete(playerId: string): void {
    this.profiles.delete(playerId);
  }
}
