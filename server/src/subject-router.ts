import express from 'express';
import reviewService from './review-service';

/**
 * Express router containing subject and review methods.
 */
const router = express.Router();

/**
 * Get all subjects for a specific campus.
 */
router.get('/campus/:campus/subjects', (request, response) => {
  const campus = request.params.campus;
  reviewService
    .getSubjectsByCampus(campus)
    .then((subjects) => response.send(subjects))
    .catch((error) => response.status(500).send(error));
});

/**
 * Get details for a specific subject.
 */
router.get('/subjects/:id', (request, response) => {
  const id = Number(request.params.id);
  reviewService
    .getSubject(id)
    .then((subject) =>
      subject ? response.send(subject) : response.status(404).send('Subject not found'),
    )
    .catch((error) => response.status(500).send(error));
});

/**
 * Create a new subject for a specific campus.
 * Example request body: { name: "New Subject" }
 * Example response body: { id: 4 }
 */
router.post('/campus/:campus/subjects', (request, response) => {
  const campus = request.params.campus;
  const data = request.body;
  if (data && data.name && data.name.length !== 0) {
    reviewService
      .createSubject(campus, data.name)
      .then((id) => response.send({ id }))
      .catch((error) => response.status(500).send(error));
  } else {
    response.status(400).send('Missing subject name');
  }
});

/**
 * Create a new review for a specific subject.
 * Example request body: { text: "Great subject!" }
 */
router.post('/subjects/:id/reviews', (request, response) => {
  const subjectId = Number(request.params.id);
  const data = request.body;
  if (data && data.text && data.text.length !== 0) {
    reviewService
      .createReview(subjectId, data.text)
      .then((id) => response.send({ id }))
      .catch((error) => response.status(500).send(error));
  } else {
    response.status(400).send('Missing review text');
  }
});

// Search subjects by name and tags
router.get('/search', async (req, res) => {
  const { query } = req.query;

  try {
    const subjects = await searchSubjects(query);
    res.json(subjects);
  } catch (error) {
    console.error('Error searching subjects:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
