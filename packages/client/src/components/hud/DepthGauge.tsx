import { useState, useEffect } from 'react';

export function DepthGauge() {
  const [depth, setDepth] = useState(2847);

  useEffect(() => {
    const interval = setInterval(() => {
      setDepth((d) => d + Math.floor(Math.random() * 3) - 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem', letterSpacing: '2px' }}>
        DEPTH
      </span>
      <span style={{
        color: 'var(--accent-green)',
        fontSize: '1.4rem',
        letterSpacing: '3px',
        textShadow: '0 0 8px rgba(0, 255, 136, 0.3)',
      }}>
        {depth}m
      </span>
    </div>
  );
}
