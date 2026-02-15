import { Link } from 'react-router-dom'
import './Home.css'

export default function Home() {
  return (
    <div className="home-page">
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">CourseWayy</div>
          <nav className="nav">
            <Link to="/dashboard">Explore</Link>
            <Link to="/">About</Link>
            <Link to="/login">Log in</Link>
            <Link to="/signup" className="cta">Join for Free</Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>Achieve your career goals with <span className="brand-strong">Pasinduteshan</span></h1>
            <p className="lead">Subscribe to build job-ready skills from world-class institutions.</p>
            <p className="price">cancel anytime</p>
            <div className="hero-cta">
              <Link to="/dashboard" className="btn primary" style={{ textDecoration: 'none', display: 'inline-block' }}>Explore Courses</Link>
              <a className="hero-link" href="#">start your free trial</a>
            </div>
          </div>

          <div className="hero-visual" aria-hidden>
            <div className="visual-figure">
              {/* placeholder illustration */}
              <svg width="320" height="220" viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="320" height="220" rx="16" fill="#e6eefb" />
                <circle cx="240" cy="80" r="44" fill="#60a5fa" />
                <rect x="40" y="120" width="220" height="60" rx="8" fill="#93c5fd" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section className="partners">
        <div className="partners-inner">
          <h3>Learn from 350+ top universities and companies</h3>
          <div className="logos">
            <div className="logo">ILLINOIS</div>
            <div className="logo">Duke</div>
            <div className="logo">Google</div>
            <div className="logo">Michigan</div>
            <div className="logo">IBM</div>
            <div className="logo">Vanderbilt</div>
            <div className="logo">Johns Hopkins</div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="features-inner">
          <div className="feature">
            <div className="feat-icon">🎯</div>
            <h4>Explore new skills</h4>
            <p>Access 10,000+ courses in AI, business, technology, and more.</p>
          </div>
          <div className="feature">
            <div className="feat-icon">🏅</div>
            <h4>Earn valuable credentials</h4>
            <p>Get certificates for every course you finish and boost your chances of getting hired.</p>
          </div>
          <div className="feature">
            <div className="feat-icon">💡</div>
            <h4>Learn from the best</h4>
            <p>Take your skills to the next level with expert-led courses and guidance.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
