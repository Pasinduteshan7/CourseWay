import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import './Auth.css';
import { Search, X, ChevronDown, Star, Clock, Users, Menu, MessageSquare } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const thumbnails = [
  '/images/course1.jpg',
  '/images/course2.jpg',
  '/images/course3.jpg',
  '/images/course4.jpg',
  '/images/course5.jpg',
  '/images/course6.jpg',
  '/images/course7.jpg',
  '/images/course8.jpg',
  '/images/course9.jpg',
  '/images/course10.jpg',
  '/images/course11.jpg',
  '/images/course12.jpg',
  '/images/course13.jpg',
  '/images/course14.jpg',
  '/images/course15.jpg',
  '/images/course16.jpg',
  '/images/course17.jpg',
  '/images/course18.jpg',
  '/images/course19.jpg',
  '/images/course20.jpg',
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [sortBy, setSortBy] = useState('popular');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseReviews, setCourseReviews] = useState({});
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, title: '', body: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };

    checkAuth();
    const handleStorageChange = () => {
      checkAuth();
    };

    // Listen for window focus (user returns to tab)
    const handleFocus = () => {
      checkAuth();
    };

    // Listen for page visibility (user comes back from another app/tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/courses`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (mounted) {
          const enrichedCourses = data.map((c, idx) => ({
            ...c,
            instructor: c.instructor || `Instructor ${idx + 1}`,
            rating: 3.5 + Math.random() * 1.5,
            reviewCount: Math.floor(Math.random() * 500) + 20,
            studentsEnrolled: Math.floor(Math.random() * 5000) + 100,
            duration: `${Math.floor(Math.random() * 30) + 4} weeks`,
            thumbnail: thumbnails[idx % thumbnails.length],
          }));
          setCourses(enrichedCourses);
        }
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

  // Get unique categories with counts
  const categories = useMemo(() => {
    const cats = {};
    courses.forEach(c => {
      cats[c.category] = (cats[c.category] || 0) + 1;
    });
    return [{ name: 'All', count: courses.length }, ...Object.entries(cats).map(([name, count]) => ({ name, count }))];
  }, [courses]);

  // Filter & Search Logic
  const filtered = useMemo(() => {
    let result = courses.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.instructor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
      const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(c.level);
      return matchesSearch && matchesCategory && matchesLevel;
    });

    // Sorting
    if (sortBy === 'popular') {
      result = [...result].sort((a, b) => b.reviewCount - a.reviewCount);
    } else if (sortBy === 'rating') {
      result = [...result].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'newest') {
      result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [courses, searchTerm, selectedCategory, selectedLevels, sortBy]);

  const toggleLevel = (level) => {
    setSelectedLevels(prev => 
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  // Open review modal to view reviews only
  const openReviewModal = async (course) => {
    setSelectedCourse(course);
    setShowReviewModal(true);

    // Fetch existing reviews for this course
    try {
      const res = await fetch(`${API_URL}/api/courses/${course._id}/reviews`);
      if (res.ok) {
        const reviews = await res.json();
        setCourseReviews(prev => ({ ...prev, [course._id]: reviews }));
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-blue-600">CourseWay</Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link>
            <Link to="/dashboard" className="text-blue-600 font-semibold">Courses</Link>
            {isAuthenticated ? (
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  setIsAuthenticated(false);
                  navigate('/login');
                }}
                className="text-gray-700 hover:text-blue-600 cursor-pointer bg-none border-none font-semibold"
              >
                Logout
              </button>
            ) : (
              <Link to="/login" className="text-gray-700 hover:text-blue-600 font-semibold">Login</Link>
            )}
          </div>
          <button className="md:hidden text-gray-700">
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Explore Courses</h1>
          <p className="text-lg text-gray-600 mb-8">Learn from the best. Find courses that match your skill level.</p>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for courses, skills, or instructors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <div className="hidden lg:block w-60 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              {/* Category Filter */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                <div className="space-y-3">
                  {categories.map(cat => (
                    <label key={cat.name} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={cat.name}
                        checked={selectedCategory === cat.name}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-4 h-4 text-blue-600 cursor-pointer"
                      />
                      <span className="text-gray-700 flex-1">{cat.name}</span>
                      <span className="text-gray-500 text-sm">{cat.count}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Level Filter */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Level</h3>
                <div className="space-y-3">
                  {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                    <label key={level} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLevels.includes(level)}
                        onChange={() => toggleLevel(level)}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                      <span className="text-gray-700">{level}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filters */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="w-full flex items-center justify-between bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <span>Filters</span>
                <ChevronDown size={20} className={`transform transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
              </button>

              {mobileFiltersOpen && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mt-4 space-y-6">
                  {/* Category Dropdown */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
                    <div className="space-y-2">
                      {categories.map(cat => (
                        <label key={cat.name} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="category"
                            value={cat.name}
                            checked={selectedCategory === cat.name}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-gray-700">{cat.name} ({cat.count})</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Level Filter Mobile */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">Level</h3>
                    <div className="space-y-2">
                      {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                        <label key={level} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedLevels.includes(level)}
                            onChange={() => toggleLevel(level)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-gray-700">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-gray-700">
                  Showing <span className="font-semibold">{filtered.length}</span> courses
                </p>
              </div>
              
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {/* Course Grid */}
            {loading && <div className="text-center py-12 text-gray-600">Loading courses…</div>}
            {error && <div className="text-center py-12 text-red-600">{error}</div>}

            {!loading && !error && (
              <>
                {filtered.length === 0 ? (
                  <div className="text-center py-12 text-gray-600">
                    <p>No courses found. Try adjusting your filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((course, idx) => (
                      <div
                        key={course._id || course.slug}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-300 group cursor-pointer flex flex-col h-full"
                      >
                        {/* Thumbnail */}
                        <div className="relative h-48 overflow-hidden bg-gray-100">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 left-3 bg-white text-sm font-semibold px-3 py-1 rounded-full text-gray-700">
                            {course.category}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col flex-grow">
                          {/* Instructor */}
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                              {course.instructor.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{course.instructor}</p>
                              <p className="text-xs text-gray-500">{course.level}</p>
                            </div>
                          </div>

                          {/* Title */}
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                            {course.title}
                          </h3>

                          {/* Rating */}
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className={i < Math.floor(course.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{course.rating.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({course.reviewCount})</span>
                          </div>

                          {/* Footer Info */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock size={16} />
                              <span>{course.duration}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users size={16} />
                              <span>{(course.studentsEnrolled || 0).toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Button */}
                          <Link
                            to={`/courses/${course.slug}`}
                            className="mt-4 w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
                          >
                            View Course
                          </Link>

                          {/* Review Button */}
                          <button
                            onClick={() => openReviewModal(course)}
                            className="mt-2 w-full bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                          >
                            <MessageSquare size={16} />
                            See Reviews
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedCourse.title}</h2>
                <p className="text-gray-600 text-sm mt-1">Share your experience with this course</p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Existing Reviews */}
              {courseReviews[selectedCourse._id]?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h3>
                  <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                    {courseReviews[selectedCourse._id].slice(0, 5).map(review => (
                      <div key={review._id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">{review.name}</p>
                            <div className="flex gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 text-sm mb-1">{review.title}</p>
                        <p className="text-gray-600 text-sm">{review.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!courseReviews[selectedCourse._id] || courseReviews[selectedCourse._id].length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-6">No reviews yet. Be the first to review this course!</p>
                  <Link 
                    to={`/courses/${selectedCourse.slug}`}
                    className="inline-block px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Go to Course & Submit Review
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">CourseWay</h3>
              <p className="text-gray-400">Learn from the best instructors and advance your career.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Courses</a></li>
                <li><a href="#" className="hover:text-white">Categories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 CourseWay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
