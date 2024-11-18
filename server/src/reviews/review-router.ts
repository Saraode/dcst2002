import express from 'express';
import { reviewService } from './review-service';
import { userService } from '../users/user-service'; // Ensure this is imported for user validation

const router = express.Router();

// Hent reviews for fag
router.get('/subjects/:id/reviews', async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`[INFO] Fetching reviews for subject ID: ${id}`);
    const reviews = await reviewService.getReviewsBySubjectId(id);
    console.log(`[SUCCESS] Fetched ${reviews.length} reviews for subject ID: ${id}`);
    res.status(200).json(reviews);
  } catch (error) {
    console.error(`[ERROR] Failed to fetch reviews for subject ID: ${id}`, error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Legg til review
router.post('/subjects/:id/reviews', async (req, res) => {
  const subjectId = req.params.id;
  const { text, stars, userId } = req.body;

  console.log(`[INFO] Received request to add review for subject ID: ${subjectId}`);
  console.log(`[INFO] Request body:`, { text, stars, userId });

  if (!text || stars == null || !userId) {
    console.error(`[ERROR] Validation failed: Missing required fields.`, { text, stars, userId });
    return res.status(400).json({ error: 'Review text, stars, or userId missing' });
  }

  try {
    console.log(`[INFO] Validating user ID: ${userId}`);
    const submitter = await userService.findUserById(userId);
    if (!submitter) {
      console.error(`[ERROR] User with ID ${userId} not found.`);
      return res.status(404).json({ error: 'User not found' });
    }
    const submitterName = submitter.name;
    console.log(`[SUCCESS] User validated: ${submitterName}`);

    console.log(`[INFO] Attempting to create review for subject ID: ${subjectId}`);
    const newReviewId = await reviewService.createReview(
      subjectId,
      text,
      stars,
      userId,
      submitterName,
    );
    console.log(`[SUCCESS] Review created with ID: ${newReviewId}`);

    const newReview = await reviewService.getReviewById(newReviewId);
    console.log(`[INFO] Fetched new review details:`, newReview);

    res.status(201).json(newReview);
  } catch (error) {
    console.error(`[ERROR] Failed to add review for subject ID: ${subjectId}`, error);
    res.status(500).json({ error: 'Could not add review' });
  }
});

// Rediger review
router.put('/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  const { text, stars, userId } = req.body;

  console.log(`[INFO] Received request to update review ID: ${reviewId}`);
  console.log(`[INFO] Request body:`, { text, stars, userId });

  try {
    const review = await reviewService.getReviewById(Number(reviewId));
    if (!review) {
      console.error(`[ERROR] Review with ID ${reviewId} not found.`);
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.userId !== Number(userId)) {
      console.error(`[ERROR] Unauthorized attempt to update review ID: ${reviewId}`);
      return res.status(403).json({ error: 'Not authorized to edit this review' });
    }

    await reviewService.updateReview(Number(reviewId), text, stars);
    console.log(`[SUCCESS] Review ID: ${reviewId} updated successfully`);
    res.status(200).json({ message: 'Review updated successfully' });
  } catch (error) {
    console.error(`[ERROR] Failed to update review ID: ${reviewId}`, error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Slett review
router.delete('/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  const { userId } = req.body;

  console.log(`[INFO] Received request to delete review ID: ${reviewId}`);
  console.log(`[INFO] Request body:`, { userId });

  try {
    const review = await reviewService.getReviewById(Number(reviewId));
    if (!review) {
      console.error(`[ERROR] Review with ID ${reviewId} not found.`);
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.userId !== Number(userId) && Number(userId) !== 35) {
      console.error(`[ERROR] Unauthorized attempt to delete review ID: ${reviewId}`);
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    await reviewService.deleteReview(Number(reviewId));
    console.log(`[SUCCESS] Review ID: ${reviewId} deleted successfully`);
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error(`[ERROR] Failed to delete review ID: ${reviewId}`, error);
    res.status(500).json({ error: 'Could not delete review' });
  }
});

//Hent stjerner
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

export { router as reviewRouter };
