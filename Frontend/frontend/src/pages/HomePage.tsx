import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const SHAYARIS = [
  "Kiraye pe khushiyaan, bina kisi fikar ke! 🌟",
  "Why buy and store, when you can rent and explore? 🎒",
  "Apna kaam nikalo bina khareede, RentLo ke saath aage badho! 🚀",
  "Own nothing you don't need, rent everything you want! ⚡",
  "Gada Electronics ho ya Alpha Rentals, sab milega RentLo pe! 📱"
]

const CATEGORIES = [
  {
    name: 'Electronics',
    svg: (color: string) => (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" fill={`${color}15`} />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <circle cx="12" cy="10" r="2" fill={color} />
      </svg>
    ),
    bgColor: '#E3F2FD',
    color: '#0288D1'
  },
  {
    name: 'Furniture',
    svg: (color: string) => (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 18v3M20 18v3" />
        <path d="M3 10h18v8H3z" fill={`${color}15`} />
        <path d="M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
    bgColor: '#E8F5E9',
    color: '#2E7D32'
  },
  {
    name: 'Photography',
    svg: (color: string) => (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" fill={`${color}15`} />
        <circle cx="12" cy="13" r="4" fill={`${color}30`} />
        <path d="M12 11a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
      </svg>
    ),
    bgColor: '#FFF3E0',
    color: '#EF6C00'
  },
  {
    name: 'Vehicles',
    svg: (color: string) => (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5.5" cy="17.5" r="2.5" fill={`${color}15`} />
        <circle cx="18.5" cy="17.5" r="2.5" fill={`${color}15`} />
        <path d="M3 6h5l3 7h7.5L21 9" />
        <line x1="8" y1="13" x2="17" y2="13" />
      </svg>
    ),
    bgColor: '#F3E5F5',
    color: '#6A1B9A'
  },
  {
    name: 'Tools',
    svg: (color: string) => (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill={`${color}15`} />
      </svg>
    ),
    bgColor: '#EFEBE9',
    color: '#4E342E'
  },
  {
    name: 'Sports',
    svg: (color: string) => (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" fill={`${color}15`} />
        <path d="M6 12A6 6 0 0 1 18 12" />
        <path d="M12 6A6 6 0 0 1 12 18" />
      </svg>
    ),
    bgColor: '#E0F2F1',
    color: '#00695C'
  }
]

export function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [shayariIndex, setShayariIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setShayariIndex((prev) => (prev + 1) % SHAYARIS.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Landing Navbar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 40px',
        background: '#fff',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: '1.8rem',
            fontFamily: 'Sora, sans-serif',
            fontWeight: 800,
            color: 'var(--primary)',
            letterSpacing: '-0.04em'
          }}>Rent<span style={{ color: 'var(--secondary)' }}>Lo</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/products" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Browse Products</Link>
          <a href="#how-it-works" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>How it Works</a>
          {user ? (
            <Link
              to={user.role === 'ADMIN' ? '/admin/dashboard' : '/products'}
              className="btn btn-primary"
              style={{ padding: '10px 22px', borderRadius: 'var(--radius)' }}
            >
              Go to Portal
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '10px 22px', borderRadius: 'var(--radius)' }}>Login</Link>
              <Link to="/signup" className="btn btn-primary" style={{ padding: '10px 22px', borderRadius: 'var(--radius)' }}>Sign Up</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section — Asymmetric Two-Column Grid */}
      <header className="rl-hero">
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: '60px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10
        }}>
          {/* Left Column: Headline, Subhead, CTAs & Hand-drawn elements */}
          <div className="animate-fade-in-up" style={{ paddingRight: '20px' }}>
            <span className="rl-hero-tagline" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
              <span>🚀</span> Share Economy Platform
            </span>
            <h1 className="rl-hero-title">
              Why buy it, when you can{' '}
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span style={{ position: 'relative', zIndex: 2 }}>RentLo</span>
                {/* Real Hand-Drawn Highlight Marker Path */}
                <svg style={{ position: 'absolute', left: '-5%', bottom: '-4px', width: '110%', height: '105%', zIndex: 1, pointerEvents: 'none', overflow: 'visible' }} viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M 0 16 C 25 10, 50 14, 100 8 C 80 18, 40 12, 10 17" fill="var(--secondary)" opacity="0.65" />
                  <path d="M 5 12 C 35 15, 70 8, 95 10" stroke="#FFD050" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4" />
                </svg>
              </span>{' '}
              it?
            </h1>
            
            <p style={{
              fontSize: '1.3rem',
              color: 'var(--text-secondary)',
              margin: '0 0 36px 0',
              lineHeight: 1.6,
              fontWeight: 450
            }}>
              Rent premium tools, laptops, photography gear, and furniture directly from trusted vendors. Zero large downpayments,{' '}
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>no deposit hassle.</span>
                {/* Hand-drawn underline SVG */}
                <svg style={{ position: 'absolute', left: 0, bottom: '-4px', width: '100%', height: '8px', overflow: 'visible' }}>
                  <path d="M 1 4 Q 30 7, 65 3 T 130 5" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" fill="none" />
                </svg>
              </span>
            </p>

            <div className="rl-cta-group" style={{ justifyContent: 'flex-start', gap: 20 }}>
              <div style={{ position: 'relative' }}>
                <button className="btn-rl-primary" onClick={() => navigate(user ? '/products' : '/signup')}>
                  Start Renting — It's Free
                </button>
                {/* Hand-drawn Arrow pointing to the Caveat pricing label */}
                <svg width="45" height="35" viewBox="0 0 45 35" fill="none" style={{ position: 'absolute', right: '-40px', bottom: '-28px', zIndex: 20, pointerEvents: 'none' }}>
                  <path d="M 5 5 C 12 18, 22 15, 35 25" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
                  <path d="M 28 24 L 35 25 L 34 18" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </div>

              <button className="btn-rl-secondary" onClick={() => navigate('/products')}>
                Browse Catalog
              </button>

              {/* Real script font note slightly skewed */}
              <div className="handwritten-annotation" style={{ position: 'relative', top: '22px', left: '16px', display: 'inline-block' }}>
                ✍️ *Gear starts at just ₹49/day!
              </div>
            </div>
          </div>

          {/* Right Column: Tilted Overlapping Product Collage (Asymmetric Hero visual) */}
          <div className="animate-slide-in-right" style={{ position: 'relative', height: '400px', width: '100%' }}>
            {/* DSLR Camera Collage Card */}
            <div className="shadow-tinted" style={{
              position: 'absolute',
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '12px',
              width: '180px',
              top: '10px',
              left: '40px',
              transform: 'rotate(-4deg)',
              zIndex: 3,
              transition: 'transform 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(-2deg) scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(-4deg) scale(1)'}
            >
              <div style={{ background: '#FFF3E0', height: '120px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF6C00" strokeWidth="1.5" style={{ margin: '0 auto' }}>
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>DSLR Camera kit</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>₹299/day</div>
            </div>

            {/* Cozy Armchair Collage Card */}
            <div className="shadow-tinted" style={{
              position: 'absolute',
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '12px',
              width: '180px',
              bottom: '20px',
              right: '20px',
              transform: 'rotate(5deg)',
              zIndex: 2,
              transition: 'transform 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(2deg) scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(5deg) scale(1)'}
            >
              <div style={{ background: '#E8F5E9', height: '120px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="1.5" style={{ margin: '0 auto' }}>
                  <path d="M3 10h18v8H3z" />
                  <path d="M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
                </svg>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Premium Sofa Chair</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>₹99/day</div>
            </div>

            {/* Macbook Laptop Collage Card */}
            <div className="shadow-tinted" style={{
              position: 'absolute',
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '14px',
              width: '210px',
              top: '110px',
              left: '160px',
              transform: 'rotate(-1deg)',
              zIndex: 4,
              transition: 'transform 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(1deg) scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(-1deg) scale(1)'}
            >
              <div style={{ background: '#E3F2FD', height: '130px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden' }}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#0288D1" strokeWidth="1.5" style={{ margin: '0 auto' }}>
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="2" y1="20" x2="22" y2="20" />
                </svg>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>MacBook Pro M2</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>₹499/day</div>
            </div>
          </div>
        </div>

        {/* Curved Divider wave SVG */}
        <div className="rl-wave-divider">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z"></path>
          </svg>
        </div>
      </header>

      {/* Categories Showcase Section — Distinct Color Identities & SVGs */}
      <section className="rl-section">
        <h2 className="rl-section-title" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800 }}>Explore by Category</h2>
        <div className="rl-categories-showcase">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className="rl-category-card"
              onClick={() => navigate(`/products?category=${cat.name}`)}
              style={{ padding: '28px 20px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
            >
              <div className="rl-category-icon" style={{ backgroundColor: cat.bgColor, color: cat.color, width: 64, height: 64 }}>
                {cat.svg(cat.color)}
              </div>
              <span className="rl-category-label" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, marginTop: 8 }}>{cat.name}</span>
            </div>
          ))}
        </div>

        {/* Shayari Buzz rotating widget */}
        <div className="rl-buzz-ticker">
          <div className="rl-buzz-title">💬 RentLo Shayari Buzz</div>
          <div className="rl-buzz-shayari">{SHAYARIS[shayariIndex]}</div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" style={{ background: '#fff', padding: '80px 24px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 className="rl-section-title" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, marginBottom: 12 }}>How RentLo Works</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 50, fontSize: '1.15rem' }}>
            Three simple steps to access quality items without the cost of ownership.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40 }}>
            {[
              { step: '01', title: 'Find & Select', desc: 'Browse premium items, select your rental dates, and submit your request.', icon: '🔍' },
              { step: '02', title: 'Store Approves & Pay', desc: 'The merchant confirms availability. Make a secure online payment using Razorpay.', icon: '💳' },
              { step: '03', title: 'Pick Up & Enjoy', desc: 'Pick up from the store or get it delivered, use it, and return when done!', icon: '🔄' }
            ].map((s) => (
              <div key={s.step} style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>{s.icon}</div>
                <div style={{
                  position: 'absolute',
                  top: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '5rem',
                  fontWeight: 900,
                  color: 'rgba(0,0,0,0.03)',
                  zIndex: 0,
                  lineHeight: 1
                }}>{s.step}</div>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.3rem', fontWeight: 700, marginBottom: 8, position: 'relative', zIndex: 1 }}>
                  {s.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, position: 'relative', zIndex: 1 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition Section — Asymmetry and flat solid panels instead of gradient cards */}
      <section className="rl-section">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 50, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '2.5rem', marginBottom: 20, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Live Smart. Buy Less. Rent More.</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: 30 }}>
              RentLo gives you instant access to high-end laptops, beautiful furniture, professional cameras, and premium gear. Own only what makes sense, rent the rest. Save money, reduce clutter, and live flexibly.
            </p>
            {/* Stat indicators with varied colors (no pink saturation) */}
            <div style={{ display: 'flex', gap: 30 }}>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0D9488' }}>70%</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Savings vs Buying</div>
              </div>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#D97706' }}>24h</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Refund Turnaround</div>
              </div>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#FF385C' }}>100%</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Verified Partners</div>
              </div>
            </div>
          </div>
          
          {/* Redesigned Card: Solid off-white with thick colored left border and custom bullet points */}
          <div className="shadow-tinted" style={{
            background: '#FFFFFF',
            borderLeft: '6px solid var(--primary)',
            borderTop: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 40,
            color: 'var(--text-primary)'
          }}>
            <h3 style={{ fontFamily: 'Sora, sans-serif', color: 'var(--text-primary)', fontSize: '1.6rem', marginBottom: 24, fontWeight: 800 }}>
              Our Community Guarantee
            </h3>
            <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                { text: 'Verified Store Partners', desc: 'We only partner with established physical stores near you.', color: '#0D9488' },
                { text: 'Detail Checklists & Audits', desc: 'Every rental item gets scanned and tested before handover.', color: '#D97706' },
                { text: 'Secure Payout Protection', desc: 'Deposit funds are locked in secure escrow accounts.', color: '#2563EB' },
                { text: 'Flexible Extensions', desc: 'Extend rental plans instantly inside the app.', color: '#9333EA' }
              ].map((item, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    backgroundColor: `${item.color}15`,
                    color: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 'bold',
                    fontSize: '0.85rem'
                  }}>
                    ✓
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{item.text}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>{item.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1E1E24', color: '#fff', padding: '60px 40px', marginTop: 'auto', borderTop: '1px solid #2A2A35' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40 }}>
          <div>
            <span style={{ fontSize: '1.8rem', fontFamily: 'Sora, sans-serif', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.04em' }}>
              Rent<span style={{ color: '#fff' }}>Lo</span>
            </span>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 12, lineHeight: 1.5 }}>
              The P2P and marketplace renting platform for smart living. Own less, enjoy more.
            </p>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: 16 }}>Explore</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem' }}>
              <Link to="/products" style={{ color: 'var(--text-muted)' }}>All Products</Link>
              <Link to="/login" style={{ color: 'var(--text-muted)' }}>Store Login</Link>
              <Link to="/signup" style={{ color: 'var(--text-muted)' }}>Become a Partner</Link>
            </div>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: 16 }}>Trust & Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem' }}>
              <a href="#" style={{ color: 'var(--text-muted)' }}>Terms of Service</a>
              <a href="#" style={{ color: 'var(--text-muted)' }}>Privacy Policy</a>
              <a href="#" style={{ color: 'var(--text-muted)' }}>Refund Policy</a>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #2A2A35', marginTop: 40, paddingTop: 20, textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} RentLo. All rights reserved. Made for modern sharing.
        </div>
      </footer>
    </div>
  )
}
