import { usePuzzleStore } from '../../../state/puzzleStore';

export function ValveSchematic() {
  const puzzleData = usePuzzleStore((s) => s.puzzleData);
  const targetStates = puzzleData.targetStates as Record<number, boolean> | undefined;
  const valveCount = (puzzleData.valveCount as number | undefined) ?? 6;

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{
        color: 'var(--text-dim)',
        letterSpacing: '3px',
        fontSize: '0.75rem',
        marginBottom: '1.5rem',
      }}>
        COMMUNICATE VALVE STATES TO OPERATOR
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem',
        maxWidth: '400px',
        margin: '0 auto',
      }}>
        {Array.from({ length: valveCount }, (_, i) => i + 1).map((id) => {
          const isOpen = targetStates?.[id] ?? false;
          return (
            <div
              key={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 1rem',
                border: `1px solid ${isOpen ? 'var(--accent-green)' : 'var(--accent-red)'}`,
                background: isOpen
                  ? 'rgba(0, 255, 136, 0.05)'
                  : 'rgba(255, 51, 51, 0.05)',
              }}
            >
              <span style={{
                color: 'var(--text-dim)',
                letterSpacing: '2px',
                fontSize: '0.85rem',
              }}>
                VALVE {id}
              </span>
              <span style={{
                color: isOpen ? 'var(--accent-green)' : 'var(--accent-red)',
                fontWeight: 'bold',
                letterSpacing: '2px',
                fontSize: '0.85rem',
              }}>
                {isOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
