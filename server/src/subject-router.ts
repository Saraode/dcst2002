// server/subject-router.ts

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

router.post('/fields/:fieldId/subjects', async (req, res) => {
  const { fieldId } = req.params;
  const { id, name, level } = req.body;

  if (!id || !name || !level) {
    return res.status(400).json({ error: 'ID, navn eller nivå mangler' });
  }

  try {
    const newSubjectId = await reviewService.createSubject(id, name, Number(fieldId), level);
    res.json({ id: newSubjectId, name, level });
  } catch (error) {
    console.error('Feil ved forsøk på å legge til emne i databasen:', error);
    res.status(500).json({ error: 'Kunne ikke legge til emne' });
  }
});

// Hent et spesifikt subject basert på id
router.get('/subjects/:id', async (req, res) => {
  const id = req.params.id;
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

// Hent alle nivåer
router.get('/levels', async (req, res) => {
  try {
    const levels = await reviewService.getAllLevels();
    res.json(levels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch levels' });
  }
});

// Opprett en ny anmeldelse for et spesifikt subject basert på emnekode (id) inkludert stjerner
router.post('/subjects/:id/reviews', async (req, res) => {
  const subjectId = req.params.id;
  const { text, stars } = req.body;

  if (!text || stars == null) {
    return res.status(400).json({ error: 'Review text og stjerner mangler' });
  }

  try {
    const newReviewId = await reviewService.createReview(subjectId, text, stars);
    res.json({ id: newReviewId });
  } catch (error) {
    console.error('Feil ved opprettelse av review:', error);
    res.status(500).json({ error: 'Kunne ikke legge til review' });
  }
});

// Ny rute for å hente alle anmeldelser for et spesifikt emne
router.get('/subjects/:id/reviews', async (req, res) => {
  const subjectId = req.params.id;
  try {
    const reviews = await reviewService.getReviewsBySubjectId(subjectId);
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Hent gjennomsnittet av stjerner for et spesifikt subject
router.get('/subjects/:id/average-stars', async (req, res) => {
  const subjectId = req.params.id;
  try {
    const averageStars = await reviewService.getAverageStarsForSubject(subjectId);
    res.json({ averageStars });
  } catch (error) {
    console.error('Error fetching average stars:', error);
    res.status(500).json({ error: 'Failed to fetch average stars' });
  }
});

// // Legg til nytt subject med fagkode og navn for et spesifikt field
// router.post('/fields/:fieldId/subjects', async (req, res) => {
//   const { fieldId } = req.params;
//   const { id, name } = req.body;

//   if (!id || !name) {
//     console.log("Emne-ID eller navn mangler.");
//     return res.status(400).json({ error: 'Fagkode (ID) eller emnenavn mangler' });
//   }

//   try {
//     console.log(`Forsøker å legge til emne med ID: ${id} og navn: ${name}`);
//     const newSubjectId = await reviewService.createSubject(id, name, Number(fieldId));
//     console.log("Emne lagt til med ID:", newSubjectId);
//     res.json({ id: newSubjectId, name });
//   } catch (error: any) {
//     console.error('Feil ved forsøk på å legge til emne i databasen:', error.message);
//     if (error.message.includes('eksisterer allerede')) {
//       return res.status(409).json({ error: 'Emnet er allerede lagt til' });
//     }
//     res.status(500).json({ error: 'Kunne ikke legge til emne' });
//   }
// });

// Hent emner for et spesifikt field basert på studienivå
// Hent emner for et spesifikt field basert på studienivå
router.get('/fields/:fieldId/subjects/level/:level', async (req, res) => {
  const { fieldId, level } = req.params;
  try {
    const subjects = await reviewService.getSubjectsByFieldAndLevel(Number(fieldId), Number(level)); // Konverter `level` til number
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects by level:', error);
    res.status(500).json({ error: 'Failed to fetch subjects by level' });
  }
});

export default router;



