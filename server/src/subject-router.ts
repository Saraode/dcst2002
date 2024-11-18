// import express from 'express';
// import { fieldService, reviewService } from './review-service';
// import { userService } from './user-service';
// import { pool } from './mysql-pool';

// const router = express.Router();

// // Hent alle campus-navn
// router.get('/campus', async (req, res) => {
//   try {
//     const campuses = await reviewService.getAllCampuses();
//     res.json(campuses);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch campuses' });
//   }
// });

// // Hent fields for en spesifikk campus
// router.get('/campus/:campus/fields', async (req, res) => {
//   const { campus } = req.params;
//   try {
//     const fields = await fieldService.getFieldsByCampus(campus);
//     res.json(fields);
//   } catch (error) {
//     console.error('Error fetching fields for campus:', error);
//     res.status(500).json({ error: 'Failed to fetch fields' });
//   }
// });

// router.post('/fields/:fieldId/subjects', async (req, res) => {
//   const { fieldId } = req.params;
//   const { id, name, level, description } = req.body;

//   // Valider at alle nødvendige felter er til stede
//   if (!id || !name || !level || !description) {
//     return res.status(400).json({ error: 'ID, navn, nivå og beskrivelse er påkrevd' });
//   }

//   try {
//     const newSubjectId = await reviewService.createSubject(
//       id,
//       name,
//       Number(fieldId),
//       level,
//       description,
//     );
//     res.status(201).json({ id: newSubjectId, name, level, description });
//   } catch (error) {
//     console.error('Feil ved oppretting av emne:', error);
//     res.status(500).json({ error: 'Kunne ikke opprette emne' });
//   }
// });

// // Fetch a specific subject by id
// router.get('/subjects/:id', async (req, res) => {
//   const id = String(req.params.id).toUpperCase(); // Konverter id til string og deretter uppercase
//   try {
//     const subject = await reviewService.getSubject(id);
//     if (subject) {
//       // Format name med stor forbokstav
//       res.json({
//         ...subject,
//         id: String(subject.id).toUpperCase(),
//         name: subject.name.charAt(0).toUpperCase() + subject.name.slice(1).toLowerCase(),
//       });
//     } else {
//       res.status(404).json({ error: 'Subject not found' });
//     }
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch subject' });
//   }
// });

// // Hent alle nivåer
// router.get('/levels', async (req, res) => {
//   try {
//     const levels = await reviewService.getAllLevels();
//     res.json(levels);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch levels' });
//   }
// });

// // Opprett en ny anmeldelse for et spesifikt subject basert på emnekode (id) inkludert stjerner
// // In the route for creating a new review
// router.post('/subjects/:id/reviews', async (req, res) => {
//   const subjectId = req.params.id;
//   const { text, stars, userId } = req.body;

//   if (!text || stars == null || !userId) {
//     return res.status(400).json({ error: 'Review text, stars, or userId missing' });
//   }

//   try {
//     const submitter = await userService.findUserById(userId);
//     if (!submitter) {
//       throw new Error('User not found');
//     }
//     const submitterName = submitter.name;

//     // Create the review
//     const newReviewId = await reviewService.createReview(
//       subjectId,
//       text,
//       stars,
//       userId,
//       submitterName,
//     );
//     1;
//     const allReviews = await reviewService.getReviewsBySubjectId(subjectId);

//     // Fetch the newly created review with `userId`, `submitterName`, and `created_date`
//     const newReview = await reviewService.getReviewById(newReviewId);

//     // Return the complete review details to the frontend
//     res.json(newReview);
//   } catch (error) {
//     console.error('Error creating review:', error);
//     res.status(500).json({ error: 'Could not add review' });
//   }
// });

// // Ny rute for å hente alle anmeldelser for et spesifikt emne
// router.get('/subjects/:id/reviews', async (req, res) => {
//   const subjectId = req.params.id;
//   try {
//     const reviews = await reviewService.getReviewsBySubjectId(subjectId);
//     res.json(reviews);
//   } catch (error) {
//     console.error('Error fetching reviews:', error);
//     res.status(500).json({ error: 'Failed to fetch reviews' });
//   }
// });

// // Hent gjennomsnittet av stjerner for et spesifikt subject
// router.get('/subjects/:id/average-stars', async (req, res) => {
//   const subjectId = req.params.id;
//   try {
//     const averageStars = await reviewService.getAverageStarsForSubject(subjectId);
//     res.json({ averageStars });
//   } catch (error) {
//     console.error('Error fetching average stars:', error);
//     res.status(500).json({ error: 'Failed to fetch average stars' });
//   }
// });

// // Legg til nytt emne for et spesifikt felt, inkludert emnebeskrivelse
// router.post('/fields/:fieldId/subjects', async (req, res) => {
//   const { fieldId } = req.params;
//   const { id, name, level, description } = req.body;

//   if (!id || !name || !level || !description) {
//     console.log('ID, navn, nivå eller beskrivelse mangler.');
//     return res.status(400).json({ error: 'ID, navn, nivå eller beskrivelse mangler' });
//   }

//   try {
//     const newSubjectId = await reviewService.createSubject(
//       id,
//       name,
//       Number(fieldId),
//       level,
//       description,
//     );
//     res.json({ id: newSubjectId, name, level, description });
//   } catch (error) {
//     console.error('Feil ved forsøk på å legge til emne i databasen:', error);
//     res.status(500).json({ error: 'Kunne ikke legge til emne' });
//   }
// });

// // Hent emner for et spesifikt field basert på studienivå
// router.get('/fields/:fieldId/subjects/level/:level', async (req, res) => {
//   const { fieldId, level } = req.params;
//   try {
//     const subjects = await reviewService.getSubjectsByFieldAndLevel(Number(fieldId), Number(level)); // Konverter `level` til number
//     res.json(subjects);
//   } catch (error) {
//     console.error('Error fetching subjects by level:', error);
//     res.status(500).json({ error: 'Failed to fetch subjects by level' });
//   }
// });

// // Delete a review
// router.delete('/reviews/:reviewId', async (req, res) => {
//   const { reviewId } = req.params;
//   const { userId } = req.body; // Expect userId from the request body

//   try {
//     const review = await reviewService.getReviewById(Number(reviewId));

//     // Allow if user is the owner or a moderator
//     if (!review || (review.userId !== Number(userId) && Number(userId) !== 35)) {
//       return res.status(403).json({ error: 'Not authorized to delete this review' });
//     }

//     await reviewService.deleteReview(Number(reviewId));
//     res.status(200).json({ message: 'Review deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting review:', error);
//     res.status(500).json({ error: 'Could not delete review' });
//   }
// });

// // Update a review
// router.put('/reviews/:reviewId', async (req, res) => {
//   const { reviewId } = req.params;
//   const { text, stars, userId } = req.body;

//   try {
//     const review = await reviewService.getReviewById(Number(reviewId));

//     // Check if review exists and the user is the owner
//     if (!review || review.userId !== Number(userId)) {
//       return res.status(403).json({ error: 'Not authorized to edit this review' });
//     }

//     await reviewService.updateReview(Number(reviewId), text, stars);
//     res.status(200).json({ message: 'Review updated successfully' });
//   } catch (error) {
//     console.error('Error updating review:', error);
//     res.status(500).json({ error: 'Could not update review' });
//   }
// });

// // Update subject
// router.put('/subjects/:subjectId', async (req, res) => {
//   const { subjectId } = req.params;
//   const { userId, levelId, description } = req.body;

//   if (Number(userId) !== 35) {
//     return res.status(403).json({ error: 'Not authorized to edit this subject' });
//   }

//   if (!description && !levelId) {
//     return res.status(400).json({ error: 'No updates provided (description or levelId missing)' });
//   }

//   try {
//     if (levelId) {
//       await reviewService.updateSubjectLevel(subjectId, levelId);
//     }

//     if (description) {
//       await pool
//         .promise()
//         .query('UPDATE Subjects SET description = ? WHERE id = ?', [description, subjectId]);
//     }

//     res.status(200).json({ message: 'Subject updated successfully' });
//   } catch (error) {
//     console.error('Error updating subject:', error);
//     res.status(500).json({ error: 'Could not update subject' });
//   }
// });

// // Delete subject
// router.delete('/subjects/:subjectId', async (req, res) => {
//   const { subjectId } = req.params;
//   const { userId, fieldId } = req.body;

//   if (Number(userId) !== 35) {
//     return res.status(403).json({ error: 'Not authorized to delete this subject' });
//   }

//   try {
//     await reviewService.deleteSubject(subjectId);

//     res.status(200).json({ message: 'Subject deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting subject:', error);
//     res.status(500).json({ error: 'Could not delete subject' });
//   }
// });

// export default router;
