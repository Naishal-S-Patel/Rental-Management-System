interface StatusStep {
  key: string
  label: string
}

interface StatusStepperProps {
  steps: StatusStep[]
  currentStep: string
  /** Steps that are "done" (before current). If not provided, auto-computed from steps order. */
  doneSteps?: string[]
}

export function StatusStepper({ steps, currentStep, doneSteps }: StatusStepperProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      padding: '24px 10px',
      overflowX: 'auto',
      gap: '8px',
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {steps.map((step, i) => {
        const isDone = doneSteps ? doneSteps.includes(step.key) : i < currentIndex
        const isCurrent = step.key === currentStep
        const isFuture = !isDone && !isCurrent

        // Line segment before this step (except first)
        const lineActive = isDone || isCurrent

        return (
          <div key={step.key} style={{
            display: 'flex',
            alignItems: 'center',
            flex: i === 0 ? 'none' : 1,
            minWidth: i === 0 ? 'auto' : '60px'
          }}>
            {/* Connecting Line (left of the node) */}
            {i > 0 && (
              <div style={{
                height: '4px',
                flex: 1,
                backgroundColor: lineActive ? 'var(--primary)' : 'var(--border)',
                transition: 'background-color 0.25s',
                borderRadius: '99px',
                marginRight: '8px'
              }} />
            )}

            {/* Step Node & Label Container */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              textAlign: 'center',
              cursor: 'default'
            }}>
              {/* Circle Node */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.25s',
                border: isFuture ? '2px solid var(--border-input)' : 'none',
                backgroundColor: isDone
                  ? 'var(--status-success)'
                  : isCurrent
                  ? 'var(--primary)'
                  : 'var(--bg-surface)',
                color: isDone || isCurrent ? '#fff' : 'var(--text-muted)',
                boxShadow: isCurrent ? '0 0 0 4px var(--primary-light)' : 'none',
                zIndex: 2
              }}>
                {isDone ? (
                  <span>✓</span>
                ) : isCurrent ? (
                  <span style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#fff',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'pulse 1.8s infinite ease-in-out'
                  }} />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>

              {/* Label */}
              <div style={{
                marginTop: '8px',
                fontSize: '0.75rem',
                fontWeight: isCurrent ? 800 : 500,
                color: isCurrent
                  ? 'var(--text-primary)'
                  : isDone
                  ? 'var(--text-secondary)'
                  : 'var(--text-muted)',
                whiteSpace: 'nowrap',
                fontFamily: 'Sora, sans-serif'
              }}>
                {step.label}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
