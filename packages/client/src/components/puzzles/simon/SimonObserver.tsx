import { usePuzzleStore } from '../../../state/puzzleStore';
import type { SimonColor, SimonColorMappings } from '@abyssal-echo/shared';

const COLORS: SimonColor[] = ['RED', 'BLUE', 'GREEN', 'YELLOW'];

const COLOR_STYLES: Record<SimonColor, { bg: string; text: string }> = {
  RED: { bg: 'rgba(255, 51, 51, 0.2)', text: '#ff3333' },
  BLUE: { bg: 'rgba(51, 102, 255, 0.2)', text: '#3366ff' },
  GREEN: { bg: 'rgba(0, 255, 136, 0.2)', text: '#00ff88' },
  YELLOW: { bg: 'rgba(255, 221, 51, 0.2)', text: '#ffdd33' },
};

function MappingTable({ title, mappings, activeStrikes }: {
  title: string;
  mappings: Record<number, Record<SimonColor, SimonColor>>;
  activeStrikes: number;
}) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <p style={{
        color: 'var(--text-dim)',
        fontSize: '0.7rem',
        letterSpacing: '2px',
        marginBottom: '0.4rem',
      }}>
        {title}
      </p>
      <table style={{
        borderCollapse: 'collapse',
        width: '100%',
        fontSize: '0.65rem',
        letterSpacing: '1px',
      }}>
        <thead>
          <tr>
            <th style={thStyle}>FLASH</th>
            {[0, 1, 2].map((s) => (
              <th key={s} style={{
                ...thStyle,
                background: s === activeStrikes ? 'rgba(0, 255, 136, 0.15)' : 'transparent',
                borderBottom: s === activeStrikes ? '2px solid var(--accent-green)' : '1px solid rgba(0, 255, 136, 0.2)',
              }}>
                {s} STRIKE{s !== 1 ? 'S' : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COLORS.map((flashColor) => (
            <tr key={flashColor}>
              <td style={{
                ...cellStyle,
                background: COLOR_STYLES[flashColor].bg,
                color: COLOR_STYLES[flashColor].text,
                fontWeight: 'bold',
              }}>
                {flashColor}
              </td>
              {[0, 1, 2].map((s) => {
                const pressColor = mappings[s][flashColor];
                return (
                  <td key={s} style={{
                    ...cellStyle,
                    background: s === activeStrikes
                      ? `${COLOR_STYLES[pressColor].bg}`
                      : 'transparent',
                    color: COLOR_STYLES[pressColor].text,
                    fontWeight: s === activeStrikes ? 'bold' : 'normal',
                    opacity: s === activeStrikes ? 1 : 0.6,
                  }}>
                    {pressColor}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '4px 8px',
  color: 'var(--text-dim)',
  borderBottom: '1px solid rgba(0, 255, 136, 0.2)',
  textAlign: 'center',
};

const cellStyle: React.CSSProperties = {
  padding: '4px 8px',
  textAlign: 'center',
  borderBottom: '1px solid rgba(0, 255, 136, 0.1)',
};

export function SimonObserver() {
  const puzzleData = usePuzzleStore((s) => s.puzzleData);

  const colorMappings = puzzleData.colorMappings as SimonColorMappings | undefined;
  const strikes = (puzzleData.strikes as number | undefined) ?? 0;
  const maxStrikes = (puzzleData.maxStrikes as number | undefined) ?? 3;
  const activeStrikes = Math.min(strikes, 2);

  if (!colorMappings) {
    return <p style={{ color: 'var(--text-dim)' }}>LOADING MAPPINGS...</p>;
  }

  return (
    <div style={{
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem',
      maxWidth: '400px',
    }}>
      <p style={{ color: 'var(--text-dim)', letterSpacing: '3px', fontSize: '0.75rem', margin: 0 }}>
        SIMON SAYS — COLOR MAPPINGS
      </p>
      <p style={{ color: 'var(--accent-amber)', letterSpacing: '2px', fontSize: '0.7rem', margin: 0 }}>
        ASK OPERATOR FOR DEPTH ZONE AND FLASH COLORS
      </p>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        STRIKES: <span style={{ color: strikes > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{strikes}/{maxStrikes}</span>
      </div>

      <MappingTable
        title="SHALLOW DEPTH"
        mappings={colorMappings.shallow}
        activeStrikes={activeStrikes}
      />

      <MappingTable
        title="DEEP DEPTH"
        mappings={colorMappings.deep}
        activeStrikes={activeStrikes}
      />
    </div>
  );
}
