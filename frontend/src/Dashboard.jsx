import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './Auth.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const palette = [
  ['#7c3aed', '#a78bfa'],
  ['#06b6d4', '#7dd3fc'],
  ['#ef4444', '#fca5a5'],
  ['#f59e0b', '#fde68a'],
  ['#10b981', '#86efac'],
];

export default function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/courses`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (mounted) setCourses(data);
      } catch (err) {
        console.error('Failed to load courses', err);
        if (mounted) setError('Failed to load courses');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="dashboard-page">
      <header className="dashboard-hero">
        <div className="hero-inner">
          <h1>Become an expert — explore courses</h1>
          <p className="hero-sub">Learn in-demand skills with short, practical courses. Click any card to open a course page and leave reviews.</p>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="courses-grid-wrap">
          <div className="section-header">
            <h2>Popular and recommended</h2>
            <p className="muted">Curated sample courses you can try right now</p>
          </div>

          {loading && <div className="muted">Loading courses…</div>}
          {error && <div className="error">{error}</div>}

          {!loading && !error && (
            <div className="courses-grid">
              {courses.length === 0 && <div>No courses found.</div>}
              {courses.map((c, idx) => {
                const pal = palette[idx % palette.length];
                // derive some UI-only fields
                const price = c.price ?? (c.level === 'Beginner' ? '$9.99' : '$19.99');
                const instructor = c.instructor ?? `Instructor ${c.title.split(' ')[0]}`;
                const isPopular = idx < 2; // mark first two as popular
                const isNew = idx % 4 === 0; // mark some as new

                return (
                  <article key={c._id || c.slug} className="course-card">
                    <div className="thumb" style={{ background: `linear-gradient(135deg, ${pal[0]}, ${pal[1]})` }}>
                      <div className="thumb-badge">{c.category}</div>
                      <div className="card-badges">
                        {isNew && <span className="badge new">New</span>}
                        {isPopular && <span className="badge popular">Popular</span>}
                      </div>
                    </div>

                    <div className="card-body">
                      <Link to={`/courses/${c.slug}`} className="course-link-inner">
                        <h3 className="course-title">{c.title}</h3>
                        <p className="course-desc">{c.description}</p>
                      </Link>

                      <div className="card-meta">
                        <div className="instructor">
                          <div className="avatar" aria-hidden>{(instructor || 'I').split(' ').map(s=>s[0]).slice(0,2).join('')}</div>
                          <div className="inst-info">
                            <div className="inst-name">{instructor}</div>
                            <div className="inst-sub">{c.level} • {c.language || 'EN'}</div>
                          </div>
                        </div>

                        <div className="price-enroll">
                          <div className="price">{price}</div>
                          <button className="enroll-btn" onClick={() => window.location.assign(`/courses/${c.slug}`)}>View Course</button>
                        </div>
                      </div>
                      <div className="card-meta bottom-meta">
                        <div className="tags">
                          {(c.tags || []).slice(0,3).map((t) => <span key={t} className="tag">{t}</span>)}
                        </div>
                        <div className="rating">{(c.averageRating || 0).toFixed(1)} ★</div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
