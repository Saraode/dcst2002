// server/subject-router.ts

import express from 'express';
import { fieldService, reviewService } from './review-service';
import { userService } from './user-service'; // Adjust the path if needed

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

// Opprett en ny anmeldelse for et spesifikt subject basert på emnekode (id) inkludert stjerner
router.post('/subjects/:id/reviews', async (req, res) => {
  const subjectId = req.params.id;
  const { text, stars, userId } = req.body;

  if (!text || stars == null || !userId) {
    return res.status(400).json({ error: 'Review text, stars, or userId missing' });
  }

  try {
    // Fetch the submitter's name using the userId
    const submitter = await userService.findUserById(userId); // Assuming findUserById exists in userService
    if (!submitter) {
      throw new Error('User not found'); // Handle this case appropriately
    }
    const submitterName = submitter.name;

    // Now create the review with submitterName
    const newReviewId = await reviewService.createReview(
      subjectId,
      text,
      stars,
      userId,
      submitterName,
    );

    // Return the new review details including the submitter's name
    res.json({ id: newReviewId, text, stars, submitterName });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Could not add review' });
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

// Legg til nytt subject med fagkode og navn for et spesifikt field
router.post('/fields/:fieldId/subjects', async (req, res) => {
  const { fieldId } = req.params;
  const { id, name } = req.body;

  if (!id || !name) {
    console.log('Emne-ID eller navn mangler.');
    return res.status(400).json({ error: 'Fagkode (ID) eller emnenavn mangler' });
  }

  try {
    console.log(`Forsøker å legge til emne med ID: ${id} og navn: ${name}`);
    const newSubjectId = await reviewService.createSubject(id, name, Number(fieldId));
    console.log('Emne lagt til med ID:', newSubjectId);
    res.json({ id: newSubjectId, name });
  } catch (error: any) {
    console.error('Feil ved forsøk på å legge til emne i databasen:', error.message);
    if (error.message.includes('eksisterer allerede')) {
      return res.status(409).json({ error: 'Emnet er allerede lagt til' });
    }
    res.status(500).json({ error: 'Kunne ikke legge til emne' });
  }
});

// Delete a review
router.delete('/reviews/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  const { userId } = req.body; // Expect userId from the request body

  try {
    const review = await reviewService.getReviewById(Number(reviewId));

    // Check if review exists and the user is the owner
    if (!review || review.userId !== Number(userId)) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    await reviewService.deleteReview(Number(reviewId));
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Could not delete review' });
  }
});

// Update a review
router.put('/reviews/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  const { text, stars, userId } = req.body;

  try {
    const review = await reviewService.getReviewById(Number(reviewId));

    // Check if review exists and the user is the owner
    if (!review || review.userId !== Number(userId)) {
      return res.status(403).json({ error: 'Not authorized to edit this review' });
    }

    await reviewService.updateReview(Number(reviewId), text, stars);
    res.status(200).json({ message: 'Review updated successfully' });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Could not update review' });
  }
});

export default router;
