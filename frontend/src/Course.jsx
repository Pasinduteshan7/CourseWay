import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './Auth.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export default function CoursePage() {
  const { slug } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // review form state
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

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
    if (!course) return;
    try {
      const res = await fetch(`${API_URL}/api/courses/${course._id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rating, title, body }),
      });
      const data = await res.json();
      if (res.ok) {
        // prepend
        setReviews((s) => [data, ...s]);
        setName(''); setRating(5); setTitle(''); setBody('');
      } else {
        alert(data.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  }

  async function deleteReview(id) {
    if (!confirm('Delete this review?')) return;
    try {
      const res = await fetch(`${API_URL}/api/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) setReviews((s) => s.filter((r) => r._id !== id));
      else alert('Failed to delete');
    } catch (err) { console.error(err); alert('Server error'); }
  }

  async function editReview(id) {
    const newBody = prompt('Edit review body');
    if (newBody == null) return;
    try {
      const res = await fetch(`${API_URL}/api/reviews/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: newBody }),
      });
      if (res.ok) {
        const updated = await res.json();
        setReviews((s) => s.map((r) => (r._id === id ? updated : r)));
      } else alert('Failed to update');
    } catch (err) { console.error(err); alert('Server error'); }
  }

  if (loading) return <div className="auth-container"><div className="auth-form">Loading…</div></div>;
  if (error) return <div className="auth-container"><div className="auth-form">{error}</div></div>;

  return (
    <div className="course-page">
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
                        <div className="review-actions">
                          <button onClick={() => editReview(r._id)} className="link-btn">Edit</button>
                          <button onClick={() => deleteReview(r._id)} className="link-btn">Delete</button>
                        </div>
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
