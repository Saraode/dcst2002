import express from 'express';
import { fieldService, reviewService } from './review-service';

const router = express.Router();

// Hent alle campus-navn
router.get('/campus', async (req, res) => {
  try {
    const campuses = await reviewService.getAllCampuses();
    res.json(campuses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campuses' });
  }
});

// Hent fields for en spesifikk campus
router.get('/campus/:campus/fields', async (req, res) => {
  const { campus } = req.params;
  try {
    const fields = await fieldService.getFieldsByCampus(campus);
    res.json(fields);
  } catch (error) {
    console.error('Error fetching fields for campus:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

// Legg til nytt subject med fagkode og navn for et spesifikt field
router.post('/fields/:fieldId/subjects', async (req, res) => {
  const { fieldId } = req.params;
  const { id, name } = req.body;

  if (!id || !name) {
    return res.status(400).json({ error: 'Fagkode (ID) eller emnenavn mangler' });
  }

  try {
    const newSubjectId = await reviewService.createSubject(id, name, Number(fieldId));
    res.json({ id: newSubjectId, name });
  } catch (error) {
    console.error('Feil ved forsøk på å legge til emne i databasen:', error);
    res.status(500).json({ error: 'Kunne ikke legge til emne' });
  }
});

// Hent et spesifikt subject basert på id
router.get('/subjects/:id', async (req, res) => {
  const id = req.params.id; // Emnekoden som string
  try {
    const subject = await reviewService.getSubject(id);
    if (subject) {
      res.json(subject);
    } else {
      res.status(404).json({ error: 'Subject not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subject' });
  }
});

// Opprett en ny review for et spesifikt subject basert på emnekode (id)
router.post('/subjects/:id/reviews', async (req, res) => {
  const subjectId = req.params.id; // Emnekoden som string
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Review text mangler' });
  }

  try {
    const newReviewId = await reviewService.createReview(subjectId, text);
    res.json({ id: newReviewId });
  } catch (error) {
    console.error('Feil ved opprettelse av review:', error);
    res.status(500).json({ error: 'Kunne ikke legge til review' });
  }
});

export default router;
