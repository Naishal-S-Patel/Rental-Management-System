import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface BreadcrumbItem {
  label: string
  to?: string
}

interface ControlPanelProps {
  breadcrumbs?: BreadcrumbItem[]
  title?: string
  actions?: ReactNode
  children?: ReactNode
}

export function ControlPanel({ breadcrumbs, title, actions, children }: ControlPanelProps) {
  return (
    <div className="o-control-panel">
      <div className="o-cp-left">
        <div className="o-cp-breadcrumb">
          {breadcrumbs?.map((b, i) => (
            <span key={i}>
              {i > 0 && <span className="separator"> / </span>}
              {b.to ? <Link to={b.to}>{b.label}</Link> : <span>{b.label}</span>}
            </span>
          ))}
          {title && !breadcrumbs?.length && <span>{title}</span>}
        </div>
        {children}
      </div>
      {actions && <div className="o-cp-right">{actions}</div>}
    </div>
  )
}
