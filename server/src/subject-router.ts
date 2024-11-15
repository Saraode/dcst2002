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

router.get('/subjects/search', async (req, res) => {
  const searchTerm = req.query.q as string;
  if (!searchTerm) {
    return res.json([]); // Returner tom array hvis ingen query
  }

  try {
    const subjects = await reviewService.searchSubjects(searchTerm);
    const formattedSubjects = subjects.map((subject) => ({
      ...subject,
      id: String(subject.id).toUpperCase(),
      name: subject.name.charAt(0).toUpperCase() + subject.name.slice(1).toLowerCase(),
    }));
    res.json(formattedSubjects);
  } catch (error) {
    console.error('Error searching for subjects:', error);
    res.status(500).json({ error: 'Failed to search for subjects' });
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
  const id = String(req.params.id).toUpperCase(); // Konverter id til string og deretter uppercase
  try {
    const subject = await reviewService.getSubject(id);
    if (subject) {
      // Format name med stor forbokstav
      res.json({
        ...subject,
        id: String(subject.id).toUpperCase(),
        name: subject.name.charAt(0).toUpperCase() + subject.name.slice(1).toLowerCase(),
      });
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
// In the route for creating a new review
router.post('/subjects/:id/reviews', async (req, res) => {
  const subjectId = req.params.id;
  const { text, stars, userId } = req.body;

  if (!text || stars == null || !userId) {
    return res.status(400).json({ error: 'Review text, stars, or userId missing' });
  }

  try {
    const submitter = await userService.findUserById(userId);
    if (!submitter) {
      throw new Error('User not found');
    }
    const submitterName = submitter.name;

    // Create the review
    const newReviewId = await reviewService.createReview(
      subjectId,
      text,
      stars,
      userId,
      submitterName,
    );
    1;
    const allReviews = await reviewService.getReviewsBySubjectId(subjectId);

    // Fetch the newly created review with `userId`, `submitterName`, and `created_date`
    const newReview = await reviewService.getReviewById(newReviewId);

    // Return the complete review details to the frontend
    res.json(newReview);
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
//liste over emner i en versjon
router.get('/versions/:versionId/subjects', async (req, res) => {
  const { versionId } = req.params;

  try {
    const subjects = await reviewService.getSubjectsByVersion(Number(versionId));
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects by version:', error);
    res.status(500).json({ error: 'Failed to fetch subjects by version' });
  }
});

// Legg til nytt subject med fagkode, navn og nivå (levelId) for et spesifikt field

router.post('/fields/:fieldId/subjects', async (req, res) => {
  const { fieldId } = req.params;
  const { id, name, levelId } = req.body; // Legg til levelId her

  // Valider at id, name og levelId er til stede
  if (!id || !name || !levelId) {
    console.log('Emne-ID, navn eller nivå mangler.');
    return res.status(400).json({ error: 'Fagkode (ID), emnenavn eller nivå mangler' });
  }

  try {
    console.log(`Forsøker å legge til emne med ID: ${id}, navn: ${name}, nivå: ${levelId}`);

    const newSubjectId = await reviewService.createSubject(id, name, Number(fieldId), levelId); // Inkluder levelId og userId

    res.json({ id: newSubjectId, name, levelId });
  } catch (error: any) {
    console.error('Feil ved forsøk på å legge til emne i databasen:', error.message);
    if (error.message.includes('eksisterer allerede')) {
      return res.status(409).json({ error: 'Emnet er allerede lagt til' });
    }
    res.status(500).json({ error: 'Kunne ikke legge til emne' });
  }
});

//Endpoint for versjonering med bruker-ID
router.post('/fields/:fieldId/version', async (req, res) => {
  const { fieldId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    console.error('User ID is missing for versioning');
    return res.status(400).json({ error: 'User ID is required for versioning' });
  }

  try {
    console.log(`Creating version for fieldId ${fieldId} with userId ${userId}`);
    const newVersionNumber = await reviewService.createPageVersion(Number(fieldId), userId);
    res.json({ version: newVersionNumber });
  } catch (error) {
    console.error('Error creating new field version:', error);
    res.status(500).json({ error: 'Failed to create field version' });
  }
});

//Endpoint for versjonering med bruker-ID for emner
router.post('/subjects/:subjectId/version', async (req, res) => {
  const { subjectId } = req.params;
  const { userId, actionType } = req.body;

  if (!userId) {
    console.error('User ID is missing for versioning');
    return res.status(400).json({ error: 'User ID is required for versioning' });
  }

  try {
    const newVersionNumber = await reviewService.createSubjectVersion(
      subjectId,
      userId,
      actionType,
    );
    res.json({ version: newVersionNumber });
  } catch (error) {
    console.error('Error creating new subject version:', error);
    res.status(500).json({ error: 'Failed to create subject version' });
  }
});
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

// Delete a review
router.delete('/reviews/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  const { userId } = req.body; // Expect userId from the request body

  try {
    const review = await reviewService.getReviewById(Number(reviewId));

    // Allow if user is the owner or a moderator
    if (!review || (review.userId !== Number(userId) && Number(userId) !== 35)) {
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

// Update subject
router.put('/subjects/:subjectId', async (req, res) => {
  const { subjectId } = req.params;
  const { userId, levelId } = req.body;

  if (userId !== 35) {
    return res.status(403).json({ error: 'Not authorized to edit this subject' });
  }

  try {
    await reviewService.updateSubjectLevel(subjectId, levelId);
    res.status(200).json({ message: 'Subject level updated successfully' });
  } catch (error) {
    console.error('Error updating subject level:', error);
    res.status(500).json({ error: 'Could not update subject level' });
  }
});

// Delete subject
router.delete('/subjects/:subjectId', async (req, res) => {
  const { subjectId } = req.params;
  const { userId, fieldId } = req.body;

  if (Number(userId) !== 35) {
    return res.status(403).json({ error: 'Not authorized to delete this subject' });
  }

  try {
    await reviewService.deleteSubject(subjectId);

    res.status(200).json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ error: 'Could not delete subject' });
  }
});

// router.post('/fields/:fieldId/subjects', async (req, res) => {
//   const { fieldId } = req.params;
//   const { id, name, level } = req.body;

//   console.log('Received request to add new subject:', { fieldId, id, name, level });

//   if (!id || !name || !level) {
//     return res.status(400).json({ error: 'ID, navn eller nivå mangler' });
//   }

//   try {
//     const newSubjectId = await reviewService.createSubject(id, name, Number(fieldId), level);
//     console.log('New subject created with ID:', newSubjectId);
//     res.json({ id: newSubjectId, name, level });
//   } catch (error) {
//     console.error('Feil ved forsøk på å legge til emne i databasen:', error);
//     res.status(500).json({ error: 'Kunne ikke legge til emne' });
//   }
// });

//lage en ny versjon av en side
router.post('/fields/:fieldId/version', async (req, res) => {
  const { fieldId } = req.params;
  const { userId } = req.body; // Expect userId in the body

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required for versioning' });
  }

  try {
    const newVersionNumber = await reviewService.createPageVersion(Number(fieldId), userId);
    res.json({ version: newVersionNumber });
  } catch (error) {
    console.error('Error creating new field version:', error);
    res.status(500).json({ error: 'Failed to create field version' });
  }
});

export default router;
