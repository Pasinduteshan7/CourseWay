const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// GET /api/courses
// optional query: ?search=term
router.get('/courses', async (req, res) => {
  try {
    const { search } = req.query;
    const q = {};
    if (search) {
      q.$text = { $search: search };
    }
    const courses = await Course.find(q).sort({ createdAt: -1 }).limit(200).select('title slug description category level language averageRating reviewsCount');
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/courses/:id
router.get('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id).select('-__v');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/courses/slug/:slug -> include lessons
router.get('/courses/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const course = await Course.findOne({ slug }).select('-__v');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    // load lessons
    const Lesson = require('../models/Lesson');
    const lessons = await Lesson.find({ courseId: course._id }).sort({ orderIndex: 1 }).select('-__v');
    res.json({ course, lessons });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
