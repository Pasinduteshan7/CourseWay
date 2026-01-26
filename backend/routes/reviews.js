const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Course = require('../models/Course');
const Review = require('../models/Review');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

async function recalcCourseRating(courseId) {
  const res = await Review.aggregate([
    { $match: { courseId: courseId } },
    { $group: { _id: '$courseId', avg: { $avg: '$rating' }, cnt: { $sum: 1 } } },
  ]);
  if (res.length === 0) {
    await Course.findByIdAndUpdate(courseId, { averageRating: 0, reviewsCount: 0 });
  } else {
    await Course.findByIdAndUpdate(courseId, { averageRating: res[0].avg, reviewsCount: res[0].cnt });
  }
}

// GET /api/courses/:courseId/reviews
router.get('/courses/:courseId/reviews', async (req, res) => {
  try {
    const { courseId } = req.params;
    const reviews = await Review.find({ courseId }).sort({ createdAt: -1 }).limit(200);
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/courses/:courseId/reviews
router.post('/courses/:courseId/reviews', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { name, rating, title, body } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating 1-5 required' });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const review = new Review({ courseId, userId: req.user.id, name, rating, title, body });
    await review.save();
    await recalcCourseRating(courseId);
    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/reviews/:id - Only review creator can edit
router.put('/reviews/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, body } = req.body;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    // Check if user is the review creator
    if (review.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only review creator can edit this review' });
    }
    
    if (rating) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (body !== undefined) review.body = body;
    await review.save();
    await recalcCourseRating(review.courseId);
    res.json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/reviews/:id - Only review creator can delete
router.delete('/reviews/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    // Check if user is the review creator
    if (review.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only review creator can delete this review' });
    }
    
    await Review.findByIdAndDelete(id);
    await recalcCourseRating(review.courseId);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
