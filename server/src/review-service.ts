import pool from './mysql-pool';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import express, { Request, Response } from 'express';

// Define types for Subject and Review and Fields
export type Subject = {
  id: number;
  name: string;
  campusId: string;
  reviews: Review[];
};

export type Review = {
  id: number;
  subjectId: number;
  text: string;
};

export type Field = {
  id: number,
  name: string;
};

class FieldService {
  /**
   * Get all fields.
   */
  getFields() {
    return new Promise<Field[]>((resolve, reject) => {
      pool.query('SELECT * FROM Fields', (error, results: RowDataPacket[]) => {
        if (error) return reject(error);

        resolve(results as Field[]);
      });
    });
  }

  /**
   * Get a specific field by id.
   */
  getFieldById(id: number) {
    return new Promise<Field | undefined>((resolve, reject) => {
      pool.query('SELECT * FROM Fields WHERE id = ?', [id], (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        if (results.length === 0) return resolve(undefined);

        resolve(results[0] as Field);
      });
    });
  }

  /**
   * Create a new field.
   * Resolves the newly created field id.
   */
  createField(name: string) {
    return new Promise<number>((resolve, reject) => {
      pool.query(
        'INSERT INTO Fields (name) VALUES (?)',
        [name],
        (error, results: ResultSetHeader) => {
          if (error) return reject(error);
          resolve(results.insertId);
        },
      );
    });
  }

  /**
   * Delete field by id.
   */
  deleteField(id: number) {
    return new Promise<void>((resolve, reject) => {
      pool.query('DELETE FROM Fields WHERE id = ?', [id], (error, results: ResultSetHeader) => {
        if (error) return reject(error);
        if (results.affectedRows === 0) return reject(new Error('No field deleted'));
        resolve();
      });
    });
  }
}

class ReviewService {
  /**
   * Get all subjects for a specific campus.
   */
  getSubjectsByCampus(campus: string) {
    return new Promise<Subject[]>((resolve, reject) => {
      pool.query(
        'SELECT * FROM Subjects WHERE campusId = ?',
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
  createSubject(campusId: string, name: string) {
    return new Promise<number>((resolve, reject) => {
      pool.query(
        'INSERT INTO Subjects (name, campusId) VALUES (?, ?)',
        [name, campusId],
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

const fieldService = new FieldService();

const router = express.Router();

// API-endepunkt for å hente alle Fields
router.get('/fields', async (req: Request, res: Response) => {
  try {
    const fields = await fieldService.getFields(); // Henter alle fields fra FieldService
    res.json(fields); // Returnerer fields som JSON
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

// Eksporter routeren for bruk i serveroppsettet
export { router as reviewRouter, reviewService, fieldService };
