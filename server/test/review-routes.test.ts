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
    // Tester opprettelse av en ny anmeldelse
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

      expect(response.status).toBe(201);
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

    // Tester at feil returneres hvis obligatoriske felt mangler
    it('should return 400 for missing fields', async () => {
      const response = await request(app).post('/api/v2/reviews/subjects/123/reviews').send({
        text: 'Great subject!',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Mangler tekst, stjerner, eller bruker-ID' });
      expect(reviewService.createReview).not.toHaveBeenCalled();
    });

    // Tester at feil returneres for ugyldig bruker-ID
    it('should return 404 for invalid userId', async () => {
      (userService.findUserById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).post('/api/v2/reviews/subjects/123/reviews').send({
        text: 'Great subject!',
        stars: 5,
        userId: 99,
      });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Bruker ikke funnet' });
      expect(reviewService.createReview).not.toHaveBeenCalled();
    });

    // Tester at en feil returneres hvis tjenesten kaster en feil
    it('should return 500 for service errors', async () => {
      (userService.findUserById as jest.Mock).mockResolvedValue({ id: 1, name: 'John' });
      (reviewService.createReview as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/api/v2/reviews/subjects/123/reviews').send({
        text: 'Great subject!',
        stars: 5,
        userId: 1,
      });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Kunne ikke legge til anmeldelse' });
    });
  });

  describe('DELETE /:reviewId', () => {
    // Tester sletting av en anmeldelse hvis brukeren er autorisert
    it('should delete a review if authorized', async () => {
      (reviewService.getReviewById as jest.Mock).mockResolvedValue({
        id: 123,
        userId: 1,
      });
      (reviewService.deleteReview as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).delete('/api/v2/reviews/123').send({ userId: 1 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Anmeldelse slettet' });
      expect(reviewService.deleteReview).toHaveBeenCalledWith(123);
    });

    // Tester at sletting feiler hvis brukeren ikke er autorisert
    it('should return 403 if the user is not authorized to delete', async () => {
      (reviewService.getReviewById as jest.Mock).mockResolvedValue({
        id: 123,
        userId: 2,
      });

      const response = await request(app).delete('/api/v2/reviews/123').send({ userId: 1 });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Ikke autorisert til å slette denne anmeldelsen' });
      expect(reviewService.deleteReview).not.toHaveBeenCalled();
    });

    // Tester at en feil returneres hvis anmeldelsen ikke finnes
    it('should return 404 if the review does not exist', async () => {
      (reviewService.getReviewById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).delete('/api/v2/reviews/123').send({ userId: 1 });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Anmeldelse ikke funnet' });
      expect(reviewService.deleteReview).not.toHaveBeenCalled();
    });
  });

  describe('GET /subjects/:id/reviews', () => {
    // Tester henting av anmeldelser for et emne
    it('should fetch reviews for a subject', async () => {
      const mockReviews = [
        { id: 1, text: 'Great!', stars: 5, submitterName: 'John', userId: 1 },
        { id: 2, text: 'Not bad', stars: 4, submitterName: 'Jane', userId: 2 },
      ];

      (reviewService.getReviewsBySubjectId as jest.Mock).mockResolvedValue(mockReviews);

      const response = await request(app).get('/api/v2/reviews/subjects/123/reviews');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockReviews);
      expect(reviewService.getReviewsBySubjectId).toHaveBeenCalledWith('123');
    });

    // Tester at en feil returneres hvis tjenesten kaster en feil
    it('should return 500 for service errors', async () => {
      (reviewService.getReviewsBySubjectId as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const response = await request(app).get('/api/v2/reviews/subjects/123/reviews');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Kunne ikke hente anmeldelser' });
    });
  });

  describe('PUT /:reviewId', () => {
    // Tester oppdatering av en anmeldelse hvis brukeren er autorisert
    it('should update a review if authorized', async () => {
      (reviewService.getReviewById as jest.Mock).mockResolvedValue({
        id: 123,
        userId: 1,
      });
      (reviewService.updateReview as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).put('/api/v2/reviews/123').send({
        text: 'Updated text',
        stars: 4,
        userId: 1,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Anmeldelse oppdatert' });
      expect(reviewService.updateReview).toHaveBeenCalledWith(123, 'Updated text', 4);
    });

    // Tester at oppdatering feiler hvis brukeren ikke er autorisert
    it('should return 403 if the user is not authorized', async () => {
      (reviewService.getReviewById as jest.Mock).mockResolvedValue({
        id: 123,
        userId: 2,
      });

      const response = await request(app).put('/api/v2/reviews/123').send({
        text: 'Updated text',
        stars: 4,
        userId: 1,
      });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Ikke autorisert til å redigere denne anmeldelsen' });
      expect(reviewService.updateReview).not.toHaveBeenCalled();
    });

    // Tester at en feil returneres hvis anmeldelsen ikke finnes
    it('should return 404 if the review does not exist', async () => {
      (reviewService.getReviewById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).put('/api/v2/reviews/123').send({
        text: 'Updated text',
        stars: 4,
        userId: 1,
      });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Anmeldelse ikke funnet' });
      expect(reviewService.updateReview).not.toHaveBeenCalled();
    });
  });
});
