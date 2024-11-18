import { reviewService } from '../src/reviews/review-service';
import { pool } from '../src/mysql-pool';

jest.mock('../src/mysql-pool', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('ReviewService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getReviewsBySubjectId', () => {
    it('should fetch reviews for a subject', async () => {
      const mockReviews = [
        { id: 1, text: 'Great!', stars: 5, submitterName: 'John', userId: 1 },
        { id: 2, text: 'Not bad', stars: 4, submitterName: 'Jane', userId: 2 },
      ];

      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(null, mockReviews);
      });

      const reviews = await reviewService.getReviewsBySubjectId('123');
      expect(reviews).toEqual(mockReviews); // Verifiser at anmeldelser returneres riktig
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, text, stars, submitterName'),
        ['123'],
        expect.any(Function),
      );
    });

    it('should handle database errors', async () => {
      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(new Error('Database error'), null);
      });

      await expect(reviewService.getReviewsBySubjectId('123')).rejects.toThrow('Database error'); // Verifiser at databasefeil håndteres riktig
    });
  });

  describe('createReview', () => {
    it('should create a review successfully', async () => {
      const mockInsertId = 1;

      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(null, { insertId: mockInsertId });
      });

      const reviewId = await reviewService.createReview('123', 'Great!', 5, 1, 'John');
      expect(reviewId).toBe(mockInsertId); // Verifiser at riktig review ID returneres
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO Reviews'),
        ['123', 'Great!', 5, 1, 'John'],
        expect.any(Function),
      );
    });

    it('should handle database errors during review creation', async () => {
      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(new Error('Database error'), null);
      });

      await expect(reviewService.createReview('123', 'Great!', 5, 1, 'John')).rejects.toThrow(
        'Database error', // Verifiser at databasefeil håndteres riktig
      );
    });
  });

  describe('getReviewById', () => {
    it('should fetch a review by ID', async () => {
      const mockReview = {
        id: 1,
        text: 'Great!',
        stars: 5,
        submitterName: 'John',
        userId: 1,
      };

      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(null, [mockReview]);
      });

      const review = await reviewService.getReviewById(1);
      expect(review).toEqual(mockReview); // Verifiser at anmeldelsen returneres riktig
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, text, stars, user_id'),
        [1],
        expect.any(Function),
      );
    });

    it('should return null if the review is not found', async () => {
      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(null, []);
      });

      const review = await reviewService.getReviewById(999);
      expect(review).toBeNull(); // Verifiser at null returneres hvis anmeldelsen ikke finnes
    });
  });

  describe('updateReview', () => {
    it('should update a review successfully', async () => {
      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(null);
      });

      await reviewService.updateReview(1, 'Updated text', 4);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE Reviews SET text = ?, stars = ?'),
        ['Updated text', 4, 1],
        expect.any(Function),
      );
    });

    it('should handle database errors during review update', async () => {
      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(new Error('Database error'), null);
      });

      await expect(reviewService.updateReview(1, 'Updated text', 4)).rejects.toThrow(
        'Database error', // Verifiser at databasefeil håndteres riktig
      );
    });
  });

  describe('deleteReview', () => {
    it('should delete a review successfully', async () => {
      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(null);
      });

      await reviewService.deleteReview(1);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM Reviews WHERE id = ?'),
        [1],
        expect.any(Function),
      );
    });

    it('should handle database errors during review deletion', async () => {
      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(new Error('Database error'), null);
      });

      await expect(reviewService.deleteReview(1)).rejects.toThrow('Database error'); // Verifiser at feil håndteres ved sletting
    });
  });

  describe('getAverageStarsForSubject', () => {
    it('should calculate the average stars for a subject', async () => {
      const mockAverage = [{ averageStars: 4.5 }];

      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(null, mockAverage);
      });

      const average = await reviewService.getAverageStarsForSubject('123');
      expect(average).toBe(4.5); // Verifiser at gjennomsnittsstjerner beregnes riktig
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT AVG(stars) as averageStars'),
        ['123'],
        expect.any(Function),
      );
    });

    it('should return 0 if no reviews are found', async () => {
      const mockAverage = [{ averageStars: null }];

      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(null, mockAverage);
      });

      const average = await reviewService.getAverageStarsForSubject('123');
      expect(average).toBe(0); // Verifiser at 0 returneres når ingen anmeldelser finnes
    });

    it('should handle database errors during average stars calculation', async () => {
      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(new Error('Database error'), null);
      });

      await expect(reviewService.getAverageStarsForSubject('123')).rejects.toThrow(
        'Database error', // Verifiser at databasefeil håndteres riktig
      );
    });
  });
});
