import { useState, useRef, useEffect } from 'react';
import { socketService } from '../../services/socketService';
import { useGameStore } from '../../state/gameStore';
import { CALIBRATION_DURATION } from '@abyssal-echo/shared';

export function CalibrationCapture() {
  const [recording, setRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(CALIBRATION_DURATION);
  const [complete, setComplete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const playerId = useGameStore((s) => s.playerId);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      stream.getTracks().forEach((t) => t.stop());

      // Upload audio for voice cloning
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'calibration.webm');
        formData.append('playerId', playerId || 'unknown');

        const res = await fetch('/api/voice-calibration', { method: 'POST', body: formData });
        const data = await res.json();
        console.log('[Calibration] Voice cloned:', data);
      } catch (err) {
        console.error('[Calibration] Upload failed:', err);
      }

      setUploading(false);
      setComplete(true);
      socketService.send({ type: 'CALIBRATION_COMPLETE' });
    };

    recorder.start();
    setRecording(true);
  };

  useEffect(() => {
    if (!recording) return;
    if (timeLeft <= 0) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [recording, timeLeft]);

  if (complete) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--accent-green)', fontSize: '1.2rem', letterSpacing: '3px' }}>
          VOICE CALIBRATION COMPLETE
        </p>
        <p style={{ color: 'var(--text-dim)', marginTop: '8px' }}>
          Awaiting partner...
        </p>
      </div>
    );
  }

  if (uploading) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--accent-amber)', fontSize: '1.2rem', letterSpacing: '3px' }}>
          PROCESSING VOICE SIGNATURE...
        </p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ color: 'var(--accent-amber)', letterSpacing: '3px', marginBottom: '1rem' }}>
        VOICE CALIBRATION
      </h3>
      {!recording ? (
        <>
          <p style={{ color: 'var(--text-dim)', marginBottom: '1rem', maxWidth: '400px' }}>
            Read the following passage aloud to calibrate the communication system.
          </p>
          <p style={{ color: 'var(--text-primary)', fontStyle: 'italic', marginBottom: '1.5rem', maxWidth: '400px' }}>
            "The submarine descended into the abyss. Pressure readings nominal. All systems operational.
            Sonar contact bearing two-seven-zero. Depth exceeding three thousand meters."
          </p>
          <button
            onClick={startRecording}
            style={{
              background: 'var(--bg-panel)',
              color: 'var(--accent-green)',
              border: '1px solid var(--accent-green)',
              padding: '12px 32px',
              fontSize: '1rem',
              letterSpacing: '3px',
            }}
          >
            BEGIN CALIBRATION
          </button>
        </>
      ) : (
        <>
          <p style={{ color: 'var(--text-primary)', fontStyle: 'italic', marginBottom: '1.5rem', maxWidth: '400px' }}>
            "The submarine descended into the abyss. Pressure readings nominal. All systems operational.
            Sonar contact bearing two-seven-zero. Depth exceeding three thousand meters."
          </p>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: '2px solid var(--accent-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 0 20px rgba(255, 51, 68, 0.3)',
            animation: 'pulse 1s ease-in-out infinite',
          }}>
            <span style={{ color: 'var(--accent-red)', fontSize: '1.5rem' }}>{timeLeft}</span>
          </div>
          <p style={{ color: 'var(--accent-red)', letterSpacing: '3px' }}>
            RECORDING...
          </p>
        </>
      )}
    </div>
  );
}
