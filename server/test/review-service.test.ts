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
    // Tester å hente anmeldelser for et emne
    it('should fetch reviews for a subject', async () => {
      const mockReviews = [
        { id: 1, text: 'Great!', stars: 5, submitterName: 'John', userId: 1 },
        { id: 2, text: 'Not bad', stars: 4, submitterName: 'Jane', userId: 2 },
      ];

      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(null, mockReviews);
      });

      const reviews = await reviewService.getReviewsBySubjectId('123');
      expect(reviews).toEqual(mockReviews);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, text, stars, submitterName'),
        ['123'],
        expect.any(Function),
      );
    });

    // Tester at databasefeil håndteres riktig
    it('should handle database errors', async () => {
      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(new Error('Database error'), null);
      });

      await expect(reviewService.getReviewsBySubjectId('123')).rejects.toThrow('Database error');
    });
  });

  describe('createReview', () => {
    // Tester å opprette en anmeldelse
    it('should create a review successfully', async () => {
      const mockInsertId = 1;

      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(null, { insertId: mockInsertId });
      });

      const reviewId = await reviewService.createReview('123', 'Great!', 5, 1, 'John');
      expect(reviewId).toBe(mockInsertId);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO Reviews'),
        ['123', 'Great!', 5, 1, 'John'],
        expect.any(Function),
      );
    });

    // Tester at databasefeil håndteres riktig ved opprettelse
    it('should handle database errors during review creation', async () => {
      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(new Error('Database error'), null);
      });

      await expect(reviewService.createReview('123', 'Great!', 5, 1, 'John')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getReviewById', () => {
    // Tester å hente en anmeldelse basert på ID
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
      expect(review).toEqual(mockReview);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, text, stars, user_id'),
        [1],
        expect.any(Function),
      );
    });

    // Tester at null returneres hvis anmeldelsen ikke finnes
    it('should return null if the review is not found', async () => {
      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(null, []);
      });

      const review = await reviewService.getReviewById(999);
      expect(review).toBeNull();
    });
  });

  describe('updateReview', () => {
    // Tester å oppdatere en anmeldelse
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

    // Tester at databasefeil håndteres riktig ved oppdatering
    it('should handle database errors during review update', async () => {
      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(new Error('Database error'), null);
      });

      await expect(reviewService.updateReview(1, 'Updated text', 4)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('deleteReview', () => {
    // Tester å slette en anmeldelse
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

    // Tester at databasefeil håndteres riktig ved sletting
    it('should handle database errors during review deletion', async () => {
      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(new Error('Database error'), null);
      });

      await expect(reviewService.deleteReview(1)).rejects.toThrow('Database error');
    });
  });

  describe('getAverageStarsForSubject', () => {
    // Tester å beregne gjennomsnittlig stjerner for et emne
    it('should calculate the average stars for a subject', async () => {
      const mockAverage = [{ averageStars: 4.5 }];

      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(null, mockAverage);
      });

      const average = await reviewService.getAverageStarsForSubject('123');
      expect(average).toBe(4.5);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT AVG(stars) as averageStars'),
        ['123'],
        expect.any(Function),
      );
    });

    // Tester at 0 returneres hvis ingen anmeldelser finnes
    it('should return 0 if no reviews are found', async () => {
      const mockAverage = [{ averageStars: null }];

      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(null, mockAverage);
      });

      const average = await reviewService.getAverageStarsForSubject('123');
      expect(average).toBe(0);
    });

    // Tester at databasefeil håndteres riktig ved beregning av gjennomsnitt
    it('should handle database errors during average stars calculation', async () => {
      (pool.query as jest.Mock).mockImplementation((query, values, callback) => {
        callback(new Error('Database error'), null);
      });

      await expect(reviewService.getAverageStarsForSubject('123')).rejects.toThrow(
        'Database error',
      );
    });
  });
});
