import { useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../state/gameStore';
import { livekitService } from '../services/livekitService';
import { BATTERY_DRAIN_RATE, BATTERY_RECHARGE_RATE, BATTERY_MAX } from '@abyssal-echo/shared';

export function usePTT() {
  const drainRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTransmit = useCallback(async () => {
    const { battery, transmitting } = useGameStore.getState();
    if (battery <= 0 || transmitting) return;

    useGameStore.getState().setTransmitting(true);

    try {
      await livekitService.publishMicrophone();
    } catch (e) {
      console.error('[PTT] Failed to publish mic:', e);
    }

    drainRef.current = setInterval(() => {
      const { battery: bat, setBattery, setTransmitting } = useGameStore.getState();
      const next = Math.max(0, bat - BATTERY_DRAIN_RATE);
      setBattery(next);
      if (next <= 0) {
        stopTransmit();
      }
    }, 1000);
  }, []);

  const stopTransmit = useCallback(async () => {
    if (!useGameStore.getState().transmitting) return;

    useGameStore.getState().setTransmitting(false);

    try {
      await livekitService.muteMicrophone();
    } catch (e) {
      console.error('[PTT] Failed to mute mic:', e);
    }

    if (drainRef.current) {
      clearInterval(drainRef.current);
      drainRef.current = null;
    }
  }, []);

  // Battery recharge when not transmitting
  useEffect(() => {
    const rechargeInterval = setInterval(() => {
      const { transmitting, battery, setBattery } = useGameStore.getState();
      if (!transmitting && battery < BATTERY_MAX) {
        setBattery(Math.min(BATTERY_MAX, battery + BATTERY_RECHARGE_RATE));
      }
    }, 1000);
    return () => clearInterval(rechargeInterval);
  }, []);

  // Keyboard handler
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        startTransmit();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        stopTransmit();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [startTransmit, stopTransmit]);

  return { startTransmit, stopTransmit };
}
