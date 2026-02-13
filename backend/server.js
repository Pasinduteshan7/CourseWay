require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const reviewsRoutes = require('./routes/reviews');
const coursesRoutes = require('./routes/courses');
const enrollmentRoutes = require('./routes/enrollment');
const Course = require('./models/Course');
const Lesson = require('./models/Lesson');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173','http://52.86.2.215:5173'],
  credentials: true,
}));

app.use(express.json());

app.get('/api/auth/health', (req, res) => {
  console.log('Health check requested');
  if (mongoose.connection.readyState === 1) {
    return res.status(200).json({ status: 'healthy', message: 'MongoDB connected' });
  }
  res.status(503).json({ status: 'unhealthy', message: 'MongoDB not connected' });
});

app.use('/api/auth', authRoutes);
app.use('/api', reviewsRoutes);
app.use('/api', coursesRoutes);
app.use('/api', enrollmentRoutes);


process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGODB_URI, { retryWrites: true, w: 'majority' })
  .then(() => {
    console.log('Connected to MongoDB successfully');

    (async function seedSample() {
      try {
        const count = await Course.countDocuments();
        if (count === 0) {
          const samples = [
            {
              title: 'Full-Stack Web Development',
              slug: 'full-stack-web-development',
              description: 'Learn REST APIs, databases, and React — a practical guide for modern web development.',
              category: 'Web Development',
              level: 'Intermediate',
              tags: ['web','react','node','mongodb'],
              price: 29.99,
            },
            {
              title: 'Cloud Fundamentals for IT',
              slug: 'cloud-fundamentals-it',
              description: 'Core cloud concepts and hands-on basics for working with cloud platforms.',
              category: 'Cloud',
              level: 'Beginner',
              tags: ['cloud','aws','gcp','azure'],
              price: 24.99,
            },
            {
              title: 'Data Structures and Algorithms',
              slug: 'data-structures-algorithms',
              description: 'Essential data structures and algorithmic techniques for software engineers.',
              category: 'Computer Science',
              level: 'Intermediate',
              tags: ['algorithms','cs'],
              price: 19.99,
            },
            {
              title: 'DevOps Basics',
              slug: 'devops-basics',
              description: 'CI/CD, containers, and automation fundamentals for teams shipping reliable software.',
              category: 'DevOps',
              level: 'Beginner',
              tags: ['devops','docker','ci'],
              price: 21.99,
            },
            {
              title: 'Full-Stack Web Development v2',
              slug: 'full-stack-web-development-v2',
              description: 'Learn REST APIs, databases, and React — a practical guide for modern web development.',
              category: 'Web Development',
              level: 'Intermediate',
              tags: ['web','react','node','mongodb'],
              price: 29.99,
            },
            // Additional IT-industry focused courses
            {
              title: 'Cybersecurity Essentials',
              slug: 'cybersecurity-essentials',
              description: 'Fundamentals of security, threat modeling, and defensive controls for modern systems.',
              category: 'Security',
              level: 'Beginner',
              tags: ['security','cybersecurity','network'],
              price: 34.99,
            },
            {
              title: 'Machine Learning Engineering',
              slug: 'machine-learning-engineering',
              description: 'Productionizing ML models, feature engineering, and model deployment practices.',
              category: 'AI/ML',
              level: 'Advanced',
              tags: ['ml','mlops','deployment'],
              price: 49.99,
            },
            {
              title: 'Data Engineering with Spark',
              slug: 'data-engineering-spark',
              description: 'Building ETL pipelines, streaming, and batch processing with Apache Spark.',
              category: 'Data Engineering',
              level: 'Intermediate',
              tags: ['data','spark','etl'],
              price: 39.99,
            },
            {
              title: 'Kubernetes for Developers',
              slug: 'kubernetes-for-developers',
              description: 'Container orchestration patterns, pod design, services, and deployments on Kubernetes.',
              category: 'Cloud',
              level: 'Intermediate',
              tags: ['kubernetes','containers','cloud'],
              price: 29.99,
            },
            {
              title: 'Site Reliability Engineering (SRE) Basics',
              slug: 'sre-basics',
              description: 'SLOs, monitoring, incident response, and reliability culture for scalable systems.',
              category: 'DevOps',
              level: 'Intermediate',
              tags: ['sre','monitoring','reliability'],
              price: 34.99,
            },
          ];

          for (const s of samples) {
            const course = await Course.create({ ...s, published: true, language: 'en' });
            // create one read-only article lesson per course
            await Lesson.create({
              courseId: course._id,
              title: `${course.title} — Introduction`,
              type: 'article',
              content: { text: `This is the introduction article for ${course.title}. It contains sample read-only material for testing the review flow.` },
              orderIndex: 1,
            });
          }

          console.log('Seeded multiple sample courses and lessons');
        }
      } catch (err) {
        console.error('Seeding error', err);
      }
    })();

    // If the old sample course exists in the DB, update only its title/description text
    (async function ensureTextUpdate() {
      try {
        const res = await Course.findOneAndUpdate(
          { slug: 'sample-article-course' },
          { $set: {
            title: 'Full-Stack Web Development',
            description: 'Learn REST APIs, databases, and React — a practical guide for modern web development.'
          } },
          { new: true }
        );
        if (res) console.log('Updated existing sample-article-course title/description');
      } catch (err) {
        console.error('Error updating sample course text', err);
      }
    })();

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });