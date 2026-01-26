const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

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

// POST /api/enroll/:courseId - Enroll in a course
router.post('/enroll/:courseId', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Check if already enrolled
    const existing = await Enrollment.findOne({ userId, courseId });
    if (existing) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Create enrollment
    const enrollment = new Enrollment({ userId, courseId, status: 'enrolled' });
    await enrollment.save();

    res.status(201).json({ message: 'Enrolled successfully', enrollment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/enrollment/:courseId - Get enrollment status for current user
router.get('/enrollment/:courseId', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const enrollment = await Enrollment.findOne({ userId, courseId }).populate('completedLessons');
    if (!enrollment) {
      return res.status(404).json({ message: 'Not enrolled' });
    }

    res.json(enrollment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/complete-lesson/:courseId/:lessonId - Mark lesson as completed
router.post('/complete-lesson/:courseId/:lessonId', verifyToken, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user.id;

    // Find enrollment
    const enrollment = await Enrollment.findOne({ userId, courseId });
    if (!enrollment) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }

    // Check if already completed
    if (enrollment.completedLessons.includes(lessonId)) {
      return res.status(400).json({ message: 'Lesson already completed' });
    }

    // Add to completed lessons
    enrollment.completedLessons.push(lessonId);

    // Get total lessons for this course
    const course = await Course.findById(courseId).populate('lessons');
    const totalLessons = course.lessons.length;
    const completedCount = enrollment.completedLessons.length + 1; // +1 for current
    enrollment.progress = Math.round((completedCount / totalLessons) * 100);

    // Update status if 100% complete
    if (enrollment.progress === 100) {
      enrollment.status = 'completed';
    } else if (enrollment.status === 'enrolled') {
      enrollment.status = 'in-progress';
    }

    await enrollment.save();

    res.json({ message: 'Lesson marked as completed', enrollment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/can-review/:courseId - Check if user can review this course
router.get('/can-review/:courseId', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const enrollment = await Enrollment.findOne({ userId, courseId });
    
    if (!enrollment) {
      return res.json({ canReview: false, reason: 'Not enrolled' });
    }

    // Get course to check total lessons
    const course = await Course.findById(courseId).populate('lessons');
    const totalLessons = course.lessons.length;
    const isCompleted = enrollment.completedLessons.length === totalLessons;

    res.json({ 
      canReview: isCompleted, 
      reason: isCompleted ? 'Eligible' : `Complete all ${totalLessons} lessons first`,
      completed: enrollment.completedLessons.length,
      total: totalLessons,
      progress: enrollment.progress
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
