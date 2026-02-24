import { useRef, useEffect } from 'react';
import { HUDOverlay } from './HUDOverlay';
import { ScanlineOverlay } from '../shared/ScanlineOverlay';
import { useLiveKit } from '../../hooks/useLiveKit';

export function SubmarineHUD() {
  useLiveKit();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const drawFrame = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background gradient
      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.7
      );
      grad.addColorStop(0, '#0f1520');
      grad.addColorStop(1, '#050810');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cockpit frame
      ctx.strokeStyle = '#1a3a4a';
      ctx.lineWidth = 3;
      const margin = 30;
      const radius = 20;
      ctx.beginPath();
      ctx.roundRect(margin, margin, canvas.width - margin * 2, canvas.height - margin * 2, radius);
      ctx.stroke();

      // Corner accents
      ctx.strokeStyle = `rgba(0, 255, 136, ${0.3 + Math.sin(time / 1000) * 0.1})`;
      ctx.lineWidth = 2;
      const cornerLen = 40;
      // Top-left
      ctx.beginPath();
      ctx.moveTo(margin, margin + cornerLen);
      ctx.lineTo(margin, margin);
      ctx.lineTo(margin + cornerLen, margin);
      ctx.stroke();
      // Top-right
      ctx.beginPath();
      ctx.moveTo(canvas.width - margin - cornerLen, margin);
      ctx.lineTo(canvas.width - margin, margin);
      ctx.lineTo(canvas.width - margin, margin + cornerLen);
      ctx.stroke();
      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(margin, canvas.height - margin - cornerLen);
      ctx.lineTo(margin, canvas.height - margin);
      ctx.lineTo(margin + cornerLen, canvas.height - margin);
      ctx.stroke();
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(canvas.width - margin - cornerLen, canvas.height - margin);
      ctx.lineTo(canvas.width - margin, canvas.height - margin);
      ctx.lineTo(canvas.width - margin, canvas.height - margin - cornerLen);
      ctx.stroke();

      animationId = requestAnimationFrame(drawFrame);
    };

    animationId = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
      <HUDOverlay />
      <ScanlineOverlay />
    </div>
  );
}
