// server/review-service.ts

import pool from './mysql-pool';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import express, { Request, Response } from 'express';

export type Subject = {
  id: number;
  name: string;
  fieldId: number;
  reviews: Review[];
};

export type Review = {
  id: number;
  subjectId: number;
  text: string;
};


/*
export const searchSubjects = async (query: string) => {
  const searchQuery = `%${query}%`; 
  const [results] = await pool.query(
  `SELECT * FROM Subjects WHERE name LIKE ? OR tags LIKE ?`,
    [searchQuery, searchQuery] 
  );
  return results;
};
*/

export type Field = {
  id: number;
  name: string;
};

export type Campus = {
  campusId: number;
  name: string;
};

class FieldService {
  getFields() {
    return new Promise<Field[]>((resolve, reject) => {
      pool.query('SELECT * FROM Fields', (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        resolve(results as Field[]);
      });
    });
  }

  getFieldById(id: number) {
    return new Promise<Field | undefined>((resolve, reject) => {
      pool.query('SELECT * FROM Fields WHERE id = ?', [id], (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        if (results.length === 0) return resolve(undefined);
        resolve(results[0] as Field);
      });
    });
  }
}


class ReviewService {
  // Hent alle subjects for en spesifikk campus
  getSubjectsByCampus(campusId: number): Promise<Subject[]> {
    return new Promise<Subject[]>((resolve, reject) => {
      pool.query(
        'SELECT * FROM Subjects WHERE campusId = ?',
        [campusId],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);
          resolve(results as Subject[]);
        },
      );
    });
  }

  getAllCampuses(): Promise<Campus[]> {
    return new Promise<Campus[]>((resolve, reject) => {
      pool.query('SELECT campusId, name FROM Campuses', (error, results) => {
        if (error) return reject(error);
        resolve(results as Campus[]);
      });
    });
  }
  
  getSubjectsByField(fieldId: number) {
    return new Promise<Subject[]>((resolve, reject) => {
      pool.query(
        'SELECT * FROM Subjects WHERE fieldId = ?',
        [fieldId],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);
          resolve(results as Subject[]);
        },
      );
    });
  }

  createSubject(fieldId: number, name: string) {
    return new Promise<number>((resolve, reject) => {
      pool.query(
        'INSERT INTO Subjects (name, fieldId) VALUES (?, ?)',
        [name, fieldId],
        (error, results: ResultSetHeader) => {
          if (error) {
            console.error('Databasefeil ved opprettelse av emne:', error);
            return reject(error);
          }
          resolve(results.insertId);
        },
      );
    });
  }

  getSubject(id: number) {
    return new Promise<Subject | undefined>((resolve, reject) => {
      pool.query('SELECT * FROM Subjects WHERE id = ?', [id], (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        if (results.length === 0) return resolve(undefined);

        const subject = results[0] as Subject;

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
}

const reviewService = new ReviewService();
const fieldService = new FieldService();

const router = express.Router();

router.get('/fields', async (req: Request, res: Response) => {
  try {
    const fields = await fieldService.getFields();
    res.json(fields);
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

router.get('/fields/:fieldId/subjects', async (req: Request, res: Response) => {
  const { fieldId } = req.params;
  try {
    const subjects = await reviewService.getSubjectsByField(Number(fieldId));
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

router.post('/fields/:fieldId/subjects', async (req: Request, res: Response) => {
  const { fieldId } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Emnenavn mangler' });
  }

  try {
    const newSubjectId = await reviewService.createSubject(Number(fieldId), name);
    console.log('Nytt emne lagt til i databasen med ID:', newSubjectId);
    res.json({ id: newSubjectId, name });
  } catch (error) {
    console.error('Feil ved forsøk på å legge til emne i databasen:', error);
    res.status(500).json({ error: 'Kunne ikke legge til emne' });
  }
});

export { router as reviewRouter, reviewService, fieldService };
