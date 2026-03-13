import {
  VOICE_DELAY_MS,
  LOWPASS_FREQUENCY,
  HIGHPASS_FREQUENCY,
  BITCRUSHER_BIT_DEPTH,
  BITCRUSHER_FREQUENCY_REDUCTION,
  RADIO_DISTORTION_GAIN,
  RADIO_NOISE_LEVEL,
} from '@abyssal-echo/shared';

export interface PipelineOptions {
  skipDelay?: boolean;
}

export class AudioPipeline {
  private ctx: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private hiddenAudio: HTMLAudioElement | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;

  async initialize(stream: MediaStream, options: PipelineOptions = {}): Promise<void> {
    this.ctx = new AudioContext();

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    const resumeOnInteraction = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    };
    document.addEventListener('click', resumeOnInteraction, { once: true });
    document.addEventListener('keydown', resumeOnInteraction, { once: true });

    console.log('[AudioPipeline] Context state:', this.ctx.state);

    // Attach stream to hidden <audio> to activate WebRTC track
    this.hiddenAudio = document.createElement('audio');
    this.hiddenAudio.srcObject = stream;
    this.hiddenAudio.volume = 0;
    this.hiddenAudio.play().catch(() => {});
    console.log('[AudioPipeline] Hidden audio element attached to activate WebRTC track');

    await this.ctx.audioWorklet.addModule('/bitcrusher-processor.js');
    console.log('[AudioPipeline] Worklet loaded, building chain');

    // Source
    this.sourceNode = this.ctx.createMediaStreamSource(stream);

    // High-pass filter (removes low rumble, makes it tinny like a radio)
    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = HIGHPASS_FREQUENCY;
    highpass.Q.value = 0.7;

    // Low-pass filter (submarine radio — cuts high frequencies)
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = LOWPASS_FREQUENCY;
    lowpass.Q.value = 1.5;

    // Bandpass resonance peak (radio mid-range emphasis)
    const bandpeak = this.ctx.createBiquadFilter();
    bandpeak.type = 'peaking';
    bandpeak.frequency.value = 1000;
    bandpeak.Q.value = 1.0;
    bandpeak.gain.value = 6;

    // Soft clipping distortion via WaveShaper (radio crackle)
    const distortion = this.ctx.createWaveShaper();
    distortion.curve = this.makeDistortionCurve(RADIO_DISTORTION_GAIN);
    distortion.oversample = '2x';

    // Bitcrusher (AudioWorklet)
    const bitcrusher = new AudioWorkletNode(this.ctx, 'bitcrusher-processor', {
      parameterData: {
        bitDepth: BITCRUSHER_BIT_DEPTH,
        frequencyReduction: BITCRUSHER_FREQUENCY_REDUCTION,
      },
    });

    // Compressor (keeps volume consistent after distortion)
    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 10;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.1;

    // Output gain (control final volume)
    const outputGain = this.ctx.createGain();
    outputGain.gain.value = 0.7;

    // Analyser (for VoiceStatusIndicator)
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 256;

    // Build chain
    let chain: AudioNode[] = [
      this.sourceNode,
      highpass,
      lowpass,
      bandpeak,
      bitcrusher,
      distortion,
      compressor,
    ];

    // Delay only for real players, not Leviathan
    if (!options.skipDelay) {
      const delay = this.ctx.createDelay(5.0);
      delay.delayTime.value = VOICE_DELAY_MS / 1000;
      chain.push(delay);
    }

    chain.push(outputGain, this.analyserNode);

    // Connect the chain
    for (let i = 0; i < chain.length - 1; i++) {
      chain[i].connect(chain[i + 1]);
    }
    this.analyserNode.connect(this.ctx.destination);

    // Add subtle static noise
    this.addStaticNoise(this.ctx, outputGain);

    const delayStr = options.skipDelay ? 'no delay' : `delay(${VOICE_DELAY_MS / 1000}s)`;
    console.log(`[AudioPipeline] Chain complete: source → highpass → lowpass → bandpeak → bitcrusher → distortion → compressor → ${delayStr} → output`);
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  private addStaticNoise(ctx: AudioContext, destination: AudioNode): void {
    // Generate a looping noise buffer
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * RADIO_NOISE_LEVEL;
    }

    this.noiseNode = ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    // Filter the noise to sound like radio static (higher frequencies)
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    this.noiseNode.connect(noiseFilter);
    noiseFilter.connect(destination);
    this.noiseNode.start();
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  destroy() {
    this.sourceNode?.disconnect();
    this.noiseNode?.stop();
    this.noiseNode?.disconnect();
    if (this.hiddenAudio) {
      this.hiddenAudio.pause();
      this.hiddenAudio.srcObject = null;
      this.hiddenAudio = null;
    }
    this.ctx?.close();
    this.ctx = null;
    this.sourceNode = null;
    this.analyserNode = null;
    this.noiseNode = null;
  }
}
