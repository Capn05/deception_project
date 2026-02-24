import { useGameStore } from '../../state/gameStore';
import { BATTERY_MAX } from '@abyssal-echo/shared';

export function BatteryMeter() {
  const battery = useGameStore((s) => s.battery);
  const segments = 10;
  const filled = Math.ceil((battery / BATTERY_MAX) * segments);

  const getColor = () => {
    if (battery > 60) return 'var(--accent-green)';
    if (battery > 25) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
      <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem', letterSpacing: '2px' }}>
        BATTERY
      </span>
      <div style={{ display: 'flex', gap: '2px' }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '20px',
              background: i < filled ? getColor() : 'var(--bg-secondary)',
              border: `1px solid ${i < filled ? getColor() : 'var(--text-dim)'}`,
              boxShadow: i < filled ? `0 0 4px ${getColor()}` : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}
