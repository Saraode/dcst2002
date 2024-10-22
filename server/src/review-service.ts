import pool from './mysql-pool';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// Define types for Subject and Review
export type Subject = {
  id: number;
  name: string;
  campus: string;
  reviews: Review[];
};

export type Review = {
  id: number;
  subjectId: number;
  text: string;
};

class ReviewService {
  /**
   * Get all subjects for a specific campus.
   */
  getSubjectsByCampus(campus: string) {
    return new Promise<Subject[]>((resolve, reject) => {
      pool.query(
        'SELECT * FROM Subjects WHERE campus = ?',
        [campus],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);

          resolve(results as Subject[]);
        },
      );
    });
  }

  /**
   * Get subject by id.
   */
  getSubject(id: number) {
    return new Promise<Subject | undefined>((resolve, reject) => {
      pool.query('SELECT * FROM Subjects WHERE id = ?', [id], (error, results: RowDataPacket[]) => {
        if (error) return reject(error);

        if (results.length === 0) return resolve(undefined);

        const subject = results[0] as Subject;

        // Get reviews for the subject
        pool.query(
          'SELECT * FROM Reviews WHERE subjectId = ?',
          [id],
          (reviewError, reviewResults: RowDataPacket[]) => {
            if (reviewError) return reject(reviewError);

            subject.reviews = reviewResults as Review[];
            resolve(subject);
          },
        );
      });
    });
  }

  /**
   * Create a new subject for a specific campus.
   * Resolves the newly created subject id.
   */
  createSubject(campus: string, name: string) {
    return new Promise<number>((resolve, reject) => {
      pool.query(
        'INSERT INTO Subjects (name, campus) VALUES (?, ?)',
        [name, campus],
        (error, results: ResultSetHeader) => {
          if (error) return reject(error);
          resolve(results.insertId);
        },
      );
    });
  }

  /**
   * Create a new review for a specific subject.
   * Resolves the newly created review id.
   */
  createReview(subjectId: number, text: string) {
    return new Promise<number>((resolve, reject) => {
      pool.query(
        'INSERT INTO Reviews (subjectId, text) VALUES (?, ?)',
        [subjectId, text],
        (error, results: ResultSetHeader) => {
          if (error) return reject(error);
          resolve(results.insertId);
        },
      );
    });
  }

  /**
   * Delete subject by id.
   */
  deleteSubject(id: number) {
    return new Promise<void>((resolve, reject) => {
      pool.query('DELETE FROM Subjects WHERE id = ?', [id], (error, results: ResultSetHeader) => {
        if (error) return reject(error);
        if (results.affectedRows == 0) return reject(new Error('No subject deleted'));
        resolve();
      });
    });
  }

  /**
   * Delete review by id.
   */
  deleteReview(id: number) {
    return new Promise<void>((resolve, reject) => {
      pool.query('DELETE FROM Reviews WHERE id = ?', [id], (error, results: ResultSetHeader) => {
        if (error) return reject(error);
        if (results.affectedRows == 0) return reject(new Error('No review deleted'));
        resolve();
      });
    });
  }
}

const reviewService = new ReviewService();
export default reviewService;
