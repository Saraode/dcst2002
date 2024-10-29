import express from 'express';
import { reviewService } from './review-service';

const router = express.Router();

router.get('/campuses', async (req, res) => {
  try {
    const campuses = await reviewService.getAllCampuses();
    res.json(campuses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campuses' });
  }
});

router.get('/campus/:campusId/subjects', async (request, response) => {
  const campusId = Number(request.params.campusId);
  try {
    const subjects = await reviewService.getSubjectsByCampus(campusId);
    response.json(subjects);
  } catch (error) {
    response.status(500).send(error);
  }
});

router.get('/subjects/:id', (request, response) => {
  const id = Number(request.params.id);
  reviewService
    .getSubject(id)
    .then((subject) =>
      subject ? response.send(subject) : response.status(404).send('Subject not found'),
    )
    .catch((error) => response.status(500).send(error));
});

router.post('/campus/:campusId/subjects', (request, response) => {
  const campusId = Number(request.params.campusId);
  const data = request.body;
  if (data && data.name && data.name.length !== 0) {
    reviewService
      .createSubject(campusId, data.name)
      .then((id) => response.send({ id }))
      .catch((error) => response.status(500).send(error));
  } else {
    response.status(400).send('Missing subject name');
  }
});

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
/*
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
*/
export default router;
