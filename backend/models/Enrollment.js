const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    status: { type: String, enum: ['enrolled', 'in-progress', 'completed'], default: 'enrolled' },
    progress: { type: Number, default: 0 }, // 0-100
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Enrollment', enrollmentSchema);
