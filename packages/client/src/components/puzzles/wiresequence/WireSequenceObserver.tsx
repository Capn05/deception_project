import { usePuzzleStore } from '../../../state/puzzleStore';
import type { WireColor, WirePort, WireSequenceCutChart } from '@abyssal-echo/shared';

const COLORS: WireColor[] = ['RED', 'BLUE', 'BLACK'];
const PORTS: WirePort[] = ['A', 'B', 'C'];
const OCCURRENCES = [1, 2, 3, 4];
const OCCURRENCE_LABELS = ['1ST', '2ND', '3RD', '4TH'];

const COLOR_STYLES: Record<WireColor, { bg: string; text: string; headerBg: string }> = {
  RED: { bg: 'rgba(255, 51, 51, 0.1)', text: '#ff3333', headerBg: 'rgba(255, 51, 51, 0.2)' },
  BLUE: { bg: 'rgba(51, 102, 255, 0.1)', text: '#3366ff', headerBg: 'rgba(51, 102, 255, 0.2)' },
  BLACK: { bg: 'rgba(160, 160, 160, 0.1)', text: '#a0a0a0', headerBg: 'rgba(160, 160, 160, 0.2)' },
};

const thStyle: React.CSSProperties = {
  padding: '3px 8px',
  color: 'var(--text-dim)',
  borderBottom: '1px solid rgba(0, 255, 136, 0.2)',
  textAlign: 'center',
  fontSize: '0.6rem',
  letterSpacing: '1px',
};

const cellStyle: React.CSSProperties = {
  padding: '3px 8px',
  textAlign: 'center',
  borderBottom: '1px solid rgba(0, 255, 136, 0.1)',
  fontSize: '0.65rem',
  letterSpacing: '1px',
};

function ColorTable({ color, chart }: { color: WireColor; chart: Record<number, Record<WirePort, boolean>> }) {
  const style = COLOR_STYLES[color];

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <p style={{
        color: style.text,
        fontSize: '0.7rem',
        fontWeight: 'bold',
        letterSpacing: '2px',
        marginBottom: '0.25rem',
        background: style.headerBg,
        padding: '2px 8px',
      }}>
        {color}
      </p>
      <table style={{
        borderCollapse: 'collapse',
        width: '100%',
        fontSize: '0.65rem',
      }}>
        <thead>
          <tr>
            <th style={thStyle}>#</th>
            {PORTS.map((p) => (
              <th key={p} style={thStyle}>PORT {p}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {OCCURRENCES.map((occ, i) => (
            <tr key={occ}>
              <td style={{ ...cellStyle, color: style.text, fontWeight: 'bold' }}>
                {OCCURRENCE_LABELS[i]}
              </td>
              {PORTS.map((port) => {
                const shouldCut = chart[occ]?.[port] ?? false;
                return (
                  <td key={port} style={{
                    ...cellStyle,
                    color: shouldCut ? '#ff3333' : 'var(--text-dim)',
                    fontWeight: shouldCut ? 'bold' : 'normal',
                    background: shouldCut ? 'rgba(255, 51, 51, 0.08)' : 'transparent',
                  }}>
                    {shouldCut ? 'CUT' : '\u2014'}
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

export function WireSequenceObserver() {
  const puzzleData = usePuzzleStore((s) => s.puzzleData);

  const cutChart = puzzleData.cutChart as WireSequenceCutChart | undefined;
  const strikes = (puzzleData.strikes as number | undefined) ?? 0;
  const maxStrikes = (puzzleData.maxStrikes as number | undefined) ?? 2;

  if (!cutChart) {
    return <p style={{ color: 'var(--text-dim)' }}>LOADING CUT CHART...</p>;
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
        WIRE SEQUENCE — CUT CHART
      </p>
      <p style={{ color: 'var(--accent-amber)', letterSpacing: '2px', fontSize: '0.7rem', margin: 0 }}>
        ASK OPERATOR FOR WIRE COLOR, OCCURRENCE, AND PORT
      </p>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        STRIKES: <span style={{ color: strikes > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{strikes}/{maxStrikes}</span>
      </div>

      {COLORS.map((color) => (
        <ColorTable key={color} color={color} chart={cutChart[color]} />
      ))}
    </div>
  );
}
