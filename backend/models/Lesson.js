const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true },
    type: { type: String, enum: ['article', 'quiz', 'video'], default: 'article' },
    content: {
      text: { type: String },
      videoUrl: { type: String },
      duration: { type: Number },
    },
    orderIndex: { type: Number, default: 0 },
    resourceUrls: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lesson', lessonSchema);
