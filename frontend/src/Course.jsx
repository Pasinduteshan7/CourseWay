import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export default function CoursePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // review form state
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.id);
      } catch (e) {
        console.error('Failed to parse token', e);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/courses/slug/${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error('Course not found');
        const data = await res.json();
        if (mounted) {
          setCourse(data.course);
          setLessons(data.lessons || []);
        }
        // load reviews
        const rev = await fetch(`${API_URL}/api/courses/${data.course._id}/reviews`);
        if (rev.ok) {
          const rdata = await rev.json();
          if (mounted) setReviews(rdata);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setError('Failed to load course');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [slug]);

  async function submitReview(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('You must be logged in to submit a review');
      navigate('/login');
      return;
    }
    
    if (!course) return;
    try {
      const res = await fetch(`${API_URL}/api/courses/${course._id}/reviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, rating, title, body }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviews((s) => [data, ...s]);
        setName(''); setRating(5); setTitle(''); setBody('');
        alert('Review submitted!');
      } else {
        alert(data.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  }

  async function editReview(id) {
    const newTitle = prompt('Edit title:');
    if (!newTitle) return;
    const newBody = prompt('Edit review:');
    if (!newBody) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTitle, body: newBody }),
      });
      if (res.ok) {
        const updated = await res.json();
        setReviews(reviews.map(r => r._id === id ? updated : r));
        alert('Review updated!');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update review');
      }
    } catch (err) {
      alert('Error updating review');
    }
  }

  async function deleteReview(id) {
    if (!confirm('Delete this review?')) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/reviews/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setReviews(reviews.filter(r => r._id !== id));
        alert('Review deleted!');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete review');
      }
    } catch (err) {
      alert('Error deleting review');
    }
  }

  if (loading) return <div className="auth-container"><div className="auth-form">Loading…</div></div>;
  if (error) return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{error}</h2>
        <p>Please log in to view course content.</p>
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <Link to="/login"><button className="primary-btn">Log In</button></Link>
          <Link to="/signup"><button className="primary-btn">Sign Up</button></Link>
        </div>
      </div>
    </div>
  );
  if (!isAuthenticated) return <div className="auth-container"><div className="auth-form">Redirecting to login...</div></div>;

  return (
    <div className="course-page">
      <div style={{ padding: '10px 20px', background: '#f5f5f5', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/dashboard" style={{ textDecoration: 'none', color: '#2196F3', fontWeight: 'bold' }}>← Back to Courses</Link>
        {isAuthenticated ? (
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              setIsAuthenticated(false);
              navigate('/login');
            }}
            style={{ padding: '8px 16px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Logout
          </button>
        ) : (
          <Link to="/login" style={{ padding: '8px 16px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', textDecoration: 'none' }}>
            Login
          </Link>
        )}
      </div>
      <div className="course-container">
        <div className="course-grid">
          <main className="course-main">
            <div className="course-card">
              <h1 className="course-title">{course.title}</h1>
              <p className="course-desc">{course.description}</p>
              <div className="course-meta"> 
                <span className="meta-item"><strong>Category:</strong> {course.category}</span>
                <span className="meta-item"><strong>Level:</strong> {course.level}</span>
                <span className="meta-item"><strong>Language:</strong> {course.language}</span>
              </div>

              <section className="lessons">
                <h3>Lessons</h3>
                <ul className="lesson-list">
                  {lessons.map((l) => (
                    <li key={l._id} className="lesson-item">
                      <div className="lesson-title">{l.title}</div>
                      <div className="lesson-type">{l.type}</div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="reviews">
                <h3>Reviews</h3>
                <div className="reviews-list">
                  {reviews.map((r) => (
                    <div key={r._id} className="review-card">
                      <div className="review-head">
                        <div>
                          <strong className="review-author">{r.name || 'Anonymous'}</strong>
                          <span className="review-rating">{r.rating} ★</span>
                          <div className="review-title">{r.title}</div>
                        </div>
                        {isAuthenticated && currentUserId === r.userId && (
                          <div className="review-actions">
                            <button onClick={() => editReview(r._id)} className="link-btn">Edit</button>
                            <button onClick={() => deleteReview(r._id)} className="link-btn">Delete</button>
                          </div>
                        )}
                      </div>
                      <p className="review-body">{r.body}</p>
                    </div>
                  ))}
                  {reviews.length === 0 && <div className="muted">No reviews yet. Be the first!</div>}
                </div>

                <div className="review-form-wrap">
                  <h4>Add a review</h4>
                  <form onSubmit={submitReview} className="review-form">
                    <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                    <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                      {[5,4,3,2,1].map((v) => <option key={v} value={v}>{v} ★</option>)}
                    </select>
                    <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    <textarea placeholder="Write your review" value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
                    <button className="primary-btn" type="submit">Submit review</button>
                  </form>
                </div>
              </section>
            </div>
          </main>

          <aside className="course-aside">
            <div className="aside-card">
              <h4>Course Info</h4>
              <p><strong>Language:</strong> {course.language}</p>
              <p><strong>Reviews:</strong> {course.reviewsCount || 0} • <strong>Avg:</strong> {(course.averageRating||0).toFixed(1)}</p>
              <div className="aside-actions">
                <Link to="/dashboard"><button className="primary-btn">Back to Dashboard</button></Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}