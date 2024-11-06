// server/review-service.ts

import { pool, updateVersion } from './mysql-pool';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import express, { Request, Response } from 'express';
import axios from 'axios';

export type Subject = {
  id: string; // Emnekoden brukes som ID
  name: string;
  fieldId: number;
  reviews: Review[];
};

export type Review = {
  id: number;
  subjectId: string;
  text: string;
};

export type Field = {
  id: number;
  name: string;
  campusId: number;
};

export type Campus = {
  campusId: number;
  name: string;
};

// FieldService for databaseoperasjoner på fields
class FieldService {
  // Hent fagområder for et bestemt campus uten å bruke Subjects
  getFieldsByCampus(campus: string) {
    return new Promise<Field[]>((resolve, reject) => {
      pool.query(
        `SELECT f.id, f.name 
         FROM Fields f 
         JOIN Campuses c ON f.campusId = c.campusId 
         WHERE c.name = ?`,
        [campus],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);
          resolve(results as Field[]);
        },
      );
    });
  }

  getFields(): Promise<Field[]> {
    return new Promise<Field[]>((resolve, reject) => {
      pool.query('SELECT * FROM Fields', (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        resolve(results as Field[]);
      });
    });
  }

  getFieldById(id: number): Promise<Field | undefined> {
    return new Promise<Field | undefined>((resolve, reject) => {
      pool.query('SELECT * FROM Fields WHERE id = ?', [id], (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        resolve(results.length > 0 ? (results[0] as Field) : undefined);
      });
    });
  }
}

// ReviewService for databaseoperasjoner på subjects og reviews
class ReviewService {
  async getAverageStarsForSubject(subjectId: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      pool.query(
        'SELECT AVG(stars) as averageStars FROM Reviews WHERE subjectId = ?',
        [subjectId],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);
          resolve(results[0].averageStars || 0); // Returnerer 0 hvis det ikke finnes anmeldelser
        },
      );
    });
  }
  async updateVersion() {
    try {
      console.log('Calling updateVersion API...');
      const response = await axios.post('http://localhost:3000/api/version/update');
      console.log('updateVersion response:', response.data);
    } catch (error) {
      console.error('Error in updateVersion:', error);
    }
  }
  // Ny funksjon for å hente alle anmeldelser for et bestemt subjectId
  getReviewsBySubjectId(subjectId: string): Promise<Review[]> {
    return new Promise<Review[]>((resolve, reject) => {
      pool.query(
        'SELECT * FROM Reviews WHERE subjectId = ? ORDER BY id DESC',
        [subjectId],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);
          resolve(results as Review[]);
        },
      );
    });
  }

  createReview(subjectId: string, text: string, stars: number): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      pool.query(
        'INSERT INTO Reviews (subjectId, text, stars) VALUES (?, ?, ?)',
        [subjectId, text, stars],
        (error, results: ResultSetHeader) => {
          if (error) return reject(error);
          resolve(results.insertId);
          this.updateVersion();
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

  getSubjectsByField(fieldId: number): Promise<Subject[]> {
    return new Promise<Subject[]>((resolve, reject) => {
      pool.query(
        'SELECT id, name FROM Subjects WHERE fieldId = ? ORDER BY id DESC', // Sortering i synkende rekkefølge
        [fieldId],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);
          console.log('Fetched subjects:', results); // Log subjects for debugging
          resolve(results as Subject[]);
        },
      );
    });
  }

  //Legg til et nytt subject (emne) i databasen
  async createSubject(id: string, name: string, fieldId: number): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      try {
        // Bruk case-insensitiv sjekk for emnekode
        const existingSubject = await this.getSubjectByIdCaseInsensitive(id);
        if (existingSubject) {
          return reject(new Error(`Subject med ID '${id}' eksisterer allerede`));
        }

        // Legg til emnet hvis det ikke eksisterer fra før
        pool.query(
          'INSERT INTO Subjects (id, name, fieldId) VALUES (?, ?, ?)',
          [id, name, fieldId],
          (error, results: ResultSetHeader) => {
            if (error) {
              console.error('Databasefeil ved opprettelse av emne:', error);
              return reject(error);
            }
            resolve(id);
            this.updateVersion(); // Kall til updateVersion etter å ha opprettet et fag
          },
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  // Funksjon for å sjekke om en emnekode allerede finnes (case-insensitivt)
  getSubjectByIdCaseInsensitive(id: string): Promise<Subject | null> {
    return new Promise<Subject | null>((resolve, reject) => {
      pool.query(
        'SELECT * FROM Subjects WHERE LOWER(id) = LOWER(?)',
        [id],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);
          resolve(results.length > 0 ? (results[0] as Subject) : null);
        },
      );
    });
  }

  // Hent en Subject basert på ID
  getSubjectById(id: string): Promise<Subject | null> {
    return new Promise<Subject | null>((resolve, reject) => {
      pool.query('SELECT * FROM Subjects WHERE id = ?', [id], (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        resolve(results.length > 0 ? (results[0] as Subject) : null);
      });
    });
  }

  // Hente anmeldelser med `stars`
  getSubject(id: string): Promise<Subject | undefined> {
    return new Promise<Subject | undefined>((resolve, reject) => {
      pool.query('SELECT * FROM Subjects WHERE id = ?', [id], (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        if (results.length === 0) return resolve(undefined);

        const subject = results[0] as Subject;
        pool.query(
          'SELECT * FROM Reviews WHERE subjectId = ? ORDER BY id DESC', // Sorter i synkende rekkefølge
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
}

// Opprett instanser av service-klassene
const reviewService = new ReviewService();
const fieldService = new FieldService();

// Definer ruter
const router = express.Router();

// Hent alle fields
router.get('/fields', async (req: Request, res: Response) => {
  try {
    const fields = await fieldService.getFields();
    res.json(fields);
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

// Hent field etter ID
router.get('/fields/:fieldId', async (req: Request, res: Response) => {
  const { fieldId } = req.params;
  try {
    const field = await fieldService.getFieldById(Number(fieldId));
    if (field) {
      res.json(field);
    } else {
      res.status(404).json({ error: 'Field not found' });
    }
  } catch (error) {
    console.error('Error fetching field by ID:', error);
    res.status(500).json({ error: 'Failed to fetch field' });
  }
});

// Hent alle campus-navn
router.get('/campuses', async (req, res) => {
  try {
    const campuses = await reviewService.getAllCampuses();
    res.json(campuses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campuses' });
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

// Hent subjects for et spesifikt field
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

// Legg til nytt subject for et spesifikt field
router.post('/fields/:fieldId/subjects', async (req: Request, res: Response) => {
  const { fieldId } = req.params;
  const { id, name } = req.body;

  if (!name || !id) {
    return res.status(400).json({ error: 'ID eller navn mangler' });
  }

  try {
    const newSubjectId = await reviewService.createSubject(id, name, Number(fieldId));
    res.json({ id: newSubjectId, name });
  } catch (error) {
    console.error('Feil ved forsøk på å legge til emne i databasen:', error);
    res.status(500).json({ error: 'Kunne ikke legge til emne' });
  }
});

export { router as reviewRouter, reviewService, fieldService };
