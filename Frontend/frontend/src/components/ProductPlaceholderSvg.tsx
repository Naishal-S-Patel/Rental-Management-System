interface Props {
  category?: string
  name?: string
}

export function ProductPlaceholderSvg({ category, name }: Props) {
  const cat = (category ?? '').toLowerCase()
  
  // Decide illustration based on category
  if (cat.includes('elect') || cat.includes('tech') || cat.includes('phone') || cat.includes('laptop')) {
    return (
      <div className="svg-placeholder" style={{ backgroundColor: '#E3F2FD', color: '#1E88E5' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <span style={{ color: '#1E88E5' }}>{category || 'Electronics'}</span>
      </div>
    )
  }

  if (cat.includes('furn') || cat.includes('chair') || cat.includes('table') || cat.includes('bed') || cat.includes('sofa')) {
    return (
      <div className="svg-placeholder" style={{ backgroundColor: '#E8F5E9', color: '#43A047' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 18v3M20 18v3M3 7h18M4 7v11h16V7" />
          <path d="M8 7V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v4" />
        </svg>
        <span style={{ color: '#43A047' }}>{category || 'Furniture'}</span>
      </div>
    )
  }

  if (cat.includes('phot') || cat.includes('came') || cat.includes('lens') || cat.includes('video')) {
    return (
      <div className="svg-placeholder" style={{ backgroundColor: '#FFF3E0', color: '#FB8C00' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        <span style={{ color: '#FB8C00' }}>{category || 'Photography'}</span>
      </div>
    )
  }

  if (cat.includes('veh') || cat.includes('car') || cat.includes('bike') || cat.includes('cycle') || cat.includes('scoot')) {
    return (
      <div className="svg-placeholder" style={{ backgroundColor: '#F3E5F5', color: '#8E24AA' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3C13 6.8 11.5 6 9.8 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h10M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM14.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
        </svg>
        <span style={{ color: '#8E24AA' }}>{category || 'Vehicles'}</span>
      </div>
    )
  }

  if (cat.includes('tool') || cat.includes('repair') || cat.includes('equip')) {
    return (
      <div className="svg-placeholder" style={{ backgroundColor: '#EFEBE9', color: '#6D4C41' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
        <span style={{ color: '#6D4C41' }}>{category || 'Tools'}</span>
      </div>
    )
  }

  if (cat.includes('sport') || cat.includes('fit') || cat.includes('game') || cat.includes('outd')) {
    return (
      <div className="svg-placeholder" style={{ backgroundColor: '#E0F2F1', color: '#00897B' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M6.2 6.2c2.4 2.4 2.4 6.4 0 8.8M17.8 6.2c-2.4 2.4-2.4 6.4 0 8.8" />
        </svg>
        <span style={{ color: '#00897B' }}>{category || 'Sports & Gear'}</span>
      </div>
    )
  }

  // Fallback box icon
  return (
    <div className="svg-placeholder" style={{ backgroundColor: '#ECEFF1', color: '#546E7A' }}>
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
      <span style={{ color: '#546E7A' }}>{category || name || 'Product'}</span>
    </div>
  )
}
