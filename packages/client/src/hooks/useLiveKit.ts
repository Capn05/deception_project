import { useEffect, useRef } from 'react';
import { useGameStore } from '../state/gameStore';
import { livekitService } from '../services/livekitService';
import { useAudioPipeline } from './useAudioPipeline';

export function useLiveKit() {
  const roomId = useGameStore((s) => s.roomId);
  const playerId = useGameStore((s) => s.playerId);
  const { attachTrack, analyser } = useAudioPipeline();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!roomId || !playerId || connectedRef.current) return;
    connectedRef.current = true;

    livekitService.setOnRemoteTrack((track, participantIdentity) => {
      console.log(`[useLiveKit] Remote audio track received from ${participantIdentity}, routing to pipeline`);
      attachTrack(track, participantIdentity);
    });

    livekitService.connect(roomId, playerId).catch(console.error);
  }, [roomId]);

  return { analyser };
}
