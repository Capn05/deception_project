import { useEffect, useRef } from 'react';
import { RemoteTrack } from 'livekit-client';
import { AudioPipeline } from '../audio/AudioPipeline';
import { useGameStore } from '../state/gameStore';
import { LEVIATHAN_IDENTITY } from '@abyssal-echo/shared';

export function useAudioPipeline() {
  const pipelineRef = useRef<AudioPipeline | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const attachTrack = async (track: RemoteTrack, participantIdentity?: string) => {
    const mediaStream = new MediaStream([track.mediaStreamTrack]);
    const isLeviathan = participantIdentity === LEVIATHAN_IDENTITY;

    const pipeline = new AudioPipeline();
    await pipeline.initialize(mediaStream, { skipDelay: isLeviathan });

    if (!isLeviathan) {
      pipelineRef.current = pipeline;
      analyserRef.current = pipeline.getAnalyser();
    } else {
      console.log('[AudioPipeline] Leviathan track: same effects, no delay');
    }

    // Poll analyser to detect incoming audio (after delay chain)
    if (pollRef.current) clearInterval(pollRef.current);
    const dataArray = new Uint8Array(analyserRef.current!.fftSize);
    pollRef.current = setInterval(() => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteTimeDomainData(dataArray);
      // Check if audio signal deviates from silence (128 = silence in unsigned byte)
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += Math.abs(dataArray[i] - 128);
      }
      const avg = sum / dataArray.length;
      const isReceiving = avg > 2;
      const current = useGameStore.getState().receiving;
      if (isReceiving !== current) {
        useGameStore.getState().setReceiving(isReceiving);
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      pipelineRef.current?.destroy();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return { attachTrack, analyser: analyserRef.current };
}
