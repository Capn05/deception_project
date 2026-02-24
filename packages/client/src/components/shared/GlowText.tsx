import { CSSProperties, ReactNode } from 'react';

interface GlowTextProps {
  children: ReactNode;
  color?: string;
  size?: string;
}

export function GlowText({ children, color = 'var(--accent-green)', size = '1rem' }: GlowTextProps) {
  const style: CSSProperties = {
    color,
    fontSize: size,
    textShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
    letterSpacing: '3px',
    fontWeight: 'bold',
  };

  return <span style={style}>{children}</span>;
}
