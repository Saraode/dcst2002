import express from 'express';
import request from 'supertest';
import { reviewRouter } from '../src/reviews/review-router';
import { reviewService } from '../src/reviews/review-service';
import { userService } from '../src/users/user-service';

jest.mock('../src/reviews/review-service');
jest.mock('../src/users/user-service');

const app = express();
app.use(express.json());
app.use('/api/v2/reviews', reviewRouter);

describe('Review Router', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /subjects/:id/reviews', () => {
    it('should create a new review', async () => {
      (userService.findUserById as jest.Mock).mockResolvedValue({ id: 1, name: 'John' });
      (reviewService.createReview as jest.Mock).mockResolvedValue(123);
      (reviewService.getReviewById as jest.Mock).mockResolvedValue({
        id: 123,
        text: 'Great subject!',
        stars: 5,
        userId: 1,
        submitterName: 'John',
      });

      const response = await request(app).post('/api/v2/reviews/subjects/123/reviews').send({
        text: 'Great subject!',
        stars: 5,
        userId: 1,
      });

      expect(response.status).toBe(201); // Verifiser at anmeldelsen er opprettet
      expect(response.body).toEqual({
        id: 123,
        text: 'Great subject!',
        stars: 5,
        userId: 1,
        submitterName: 'John',
      });
      expect(reviewService.createReview).toHaveBeenCalledWith(
        '123',
        'Great subject!',
        5,
        1,
        'John',
      );
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app).post('/api/v2/reviews/subjects/123/reviews').send({
        text: 'Great subject!',
      });

      expect(response.status).toBe(400); // Verifiser at feil håndteres når felt mangler
      expect(response.body).toEqual({ error: 'Review text, stars, or userId missing' });
      expect(reviewService.createReview).not.toHaveBeenCalled();
    });

    it('should return 404 for invalid userId', async () => {
      (userService.findUserById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).post('/api/v2/reviews/subjects/123/reviews').send({
        text: 'Great subject!',
        stars: 5,
        userId: 99,
      });

      expect(response.status).toBe(404); // Verifiser at 404 returneres for ugyldig bruker-ID
      expect(response.body).toEqual({ error: 'User not found' });
      expect(reviewService.createReview).not.toHaveBeenCalled();
    });

    it('should return 500 for service errors', async () => {
      (userService.findUserById as jest.Mock).mockResolvedValue({ id: 1, name: 'John' });
      (reviewService.createReview as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/api/v2/reviews/subjects/123/reviews').send({
        text: 'Great subject!',
        stars: 5,
        userId: 1,
      });

      expect(response.status).toBe(500); // Verifiser at feil håndteres for tjenesteproblemer
      expect(response.body).toEqual({ error: 'Could not add review' });
    });
  });

  describe('DELETE /:reviewId', () => {
    it('should delete a review if authorized', async () => {
      (reviewService.getReviewById as jest.Mock).mockResolvedValue({
        id: 123,
        userId: 1,
      });
      (reviewService.deleteReview as jest.Mock).mockResolvedValue(undefined); // Simulerer vellykket sletting

      const response = await request(app).delete('/api/v2/reviews/123').send({ userId: 1 });

      expect(response.status).toBe(200); // Verifiserer vellykket sletting
      expect(response.body).toEqual({ message: 'Review deleted successfully' });
      expect(reviewService.deleteReview).toHaveBeenCalledWith(123);
    });

    it('should return 403 if the user is not authorized to delete', async () => {
      (reviewService.getReviewById as jest.Mock).mockResolvedValue({
        id: 123,
        userId: 2, // Simulerer at anmeldelsen tilhører en annen bruker
      });

      const response = await request(app).delete('/api/v2/reviews/123').send({ userId: 1 });

      expect(response.status).toBe(403); // Verifiserer at 403 returneres for uautorisert tilgang
      expect(response.body).toEqual({ error: 'Not authorized to delete this review' });
      expect(reviewService.deleteReview).not.toHaveBeenCalled(); // Verifiserer at slettemetoden ikke ble kalt
    });

    it('should return 404 if the review does not exist', async () => {
      (reviewService.getReviewById as jest.Mock).mockResolvedValue(null); // Simulerer at anmeldelsen ikke finnes

      const response = await request(app).delete('/api/v2/reviews/123').send({ userId: 1 });

      expect(response.status).toBe(404); // Verifiserer at 404 returneres når anmeldelsen ikke finnes
      expect(response.body).toEqual({ error: 'Review not found' });
      expect(reviewService.deleteReview).not.toHaveBeenCalled(); // Verifiserer at slettemetoden ikke ble kalt
    });
  });

  describe('GET /subjects/:id/reviews', () => {
    it('should fetch reviews for a subject', async () => {
      const mockReviews = [
        { id: 1, text: 'Great!', stars: 5, submitterName: 'John', userId: 1 },
        { id: 2, text: 'Not bad', stars: 4, submitterName: 'Jane', userId: 2 },
      ];

      (reviewService.getReviewsBySubjectId as jest.Mock).mockResolvedValue(mockReviews);

      const response = await request(app).get('/api/v2/reviews/subjects/123/reviews');

      expect(response.status).toBe(200); // Verifiserer at anmeldelser hentes riktig
      expect(response.body).toEqual(mockReviews);
      expect(reviewService.getReviewsBySubjectId).toHaveBeenCalledWith('123');
    });

    it('should return 500 for service errors', async () => {
      (reviewService.getReviewsBySubjectId as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const response = await request(app).get('/api/v2/reviews/subjects/123/reviews');

      expect(response.status).toBe(500); // Verifiserer at feil håndteres for tjenesteproblemer
      expect(response.body).toEqual({ error: 'Failed to fetch reviews' });
    });
  });

  describe('PUT /:reviewId', () => {
    it('should update a review if authorized', async () => {
      (reviewService.getReviewById as jest.Mock).mockResolvedValue({
        id: 123,
        userId: 1,
      });
      (reviewService.updateReview as jest.Mock).mockResolvedValue(undefined); // Simulerer vellykket oppdatering

      const response = await request(app).put('/api/v2/reviews/123').send({
        text: 'Updated text',
        stars: 4,
        userId: 1,
      });

      expect(response.status).toBe(200); // Verifiserer vellykket oppdatering
      expect(response.body).toEqual({ message: 'Review updated successfully' });
      expect(reviewService.updateReview).toHaveBeenCalledWith(123, 'Updated text', 4);
    });

    it('should return 403 if the user is not authorized', async () => {
      (reviewService.getReviewById as jest.Mock).mockResolvedValue({
        id: 123,
        userId: 2, // Simulerer at anmeldelsen tilhører en annen bruker
      });

      const response = await request(app).put('/api/v2/reviews/123').send({
        text: 'Updated text',
        stars: 4,
        userId: 1,
      });

      expect(response.status).toBe(403); // Verifiserer at 403 returneres for uautorisert tilgang
      expect(response.body).toEqual({ error: 'Not authorized to edit this review' });
      expect(reviewService.updateReview).not.toHaveBeenCalled(); // Verifiserer at oppdateringsmetoden ikke ble kalt
    });

    it('should return 404 if the review does not exist', async () => {
      (reviewService.getReviewById as jest.Mock).mockResolvedValue(null); // Simulerer at anmeldelsen ikke finnes

      const response = await request(app).put('/api/v2/reviews/123').send({
        text: 'Updated text',
        stars: 4,
        userId: 1,
      });

      expect(response.status).toBe(404); // Verifiserer at 404 returneres når anmeldelsen ikke finnes
      expect(response.body).toEqual({ error: 'Review not found' });
      expect(reviewService.updateReview).not.toHaveBeenCalled(); // Verifiserer at oppdateringsmetoden ikke ble kalt
    });
  });
});
