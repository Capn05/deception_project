export class StaticNoiseGenerator {
  private ctx: AudioContext;
  private gainNode: GainNode;
  private noiseSource: AudioBufferSourceNode | null = null;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;
    this.gainNode.connect(ctx.destination);
  }

  burst(duration: number = 0.15, volume: number = 0.08) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }

    this.noiseSource = this.ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.connect(this.gainNode);
    this.gainNode.gain.setValueAtTime(1, this.ctx.currentTime);
    this.gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    this.noiseSource.start();
    this.noiseSource.stop(this.ctx.currentTime + duration);
  }
}
