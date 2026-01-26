const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    category: { type: String },
    level: { type: String },
    language: { type: String, default: 'en' },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    price: { type: Number, default: 0 },
    tags: [String],
    published: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
