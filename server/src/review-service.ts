// server/review-service.ts

import { pool } from './mysql-pool';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import express, { Request, Response } from 'express';
import axios from 'axios';

export type Subject = {
  id: string;
  name: string;
  fieldId: number;
  reviews: Review[];
};

export type Review = {
  id: number;
  subjectId: string;
  text: string;
  stars: number;
  submitterName: string;
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

export type SearchResult = {
  displayName: string;
  id: number;
  name: string;
};

// FieldService for databaseoperasjoner på fields
class FieldService {
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
  async searchSubjects(searchTerm: string): Promise<SearchResult[]> {
    const sql = `
      (SELECT CONCAT(id, ' ', name) AS displayName, id, name
       FROM Subjects
       WHERE id LIKE CONCAT(?, '%') OR name LIKE CONCAT(?, '%'))
      UNION ALL
      (SELECT CONCAT(id, ' ', name) AS displayName, id, name
       FROM Subjects
       WHERE (id LIKE CONCAT('%', ?, '%') OR name LIKE CONCAT('%', ?, '%'))
         AND (id NOT LIKE CONCAT(?, '%') AND name NOT LIKE CONCAT(?, '%')))
    `;
  
    try {
      const [results] = await pool.promise().query<RowDataPacket[]>(sql, [
        searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
      ]);
  
      return results.map((row: RowDataPacket) => ({
        displayName: row.displayName as string,
        id: row.id as number,
        name: row.name as string,
      }));
    } catch (error) {
      console.error('Error fetching search results:', error);
      throw new Error('Failed to fetch search results');
    }
  }

  async getTotalSubjectsCount(fieldId: number): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      pool.query(
        'SELECT COUNT(*) as total FROM Subjects WHERE fieldId = ?',
        [fieldId],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);
          resolve(results[0].total || 0);
        },
      );
    });
  }

  async getReviewById(reviewId: number): Promise<{
    id: number;
    text: string;
    stars: number;
    userId: number;
    submitterName: string;
    created_date: string;
  } | null> {
    return new Promise((resolve, reject) => {
      pool.query(
        'SELECT id, text, stars, user_id AS userId, submitterName, created_date FROM Reviews WHERE id = ?',
        [reviewId],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);
          resolve(results.length > 0 ? (results[0] as any) : null);
        },
      );
    });
  }

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

  //Funksjon for å lagre versjonen i databasen

  async createPageVersion(fieldId: number, userId: string): Promise<number> {
    console.log(`Creating version for fieldId: ${fieldId} by userId: ${userId}`);

    const [rows] = await pool
      .promise()
      .query('SELECT MAX(version_number) AS max_version FROM page_versions WHERE field_id = ?', [
        fieldId,
      ]);

    const currentVersion = (rows as RowDataPacket[])[0];
    const newVersionNumber = (currentVersion?.max_version || 0) + 1;

    const [subjects] = await pool
      .promise()
      .query<RowDataPacket[]>('SELECT id FROM Subjects WHERE fieldId = ?', [fieldId]);

    const subjectIds = subjects.map((subject: RowDataPacket) => subject.id);
    const [result] = await pool
      .promise()
      .query(
        'INSERT INTO page_versions (field_id, version_number, user_id, subject_ids, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [fieldId, newVersionNumber, userId, JSON.stringify(subjectIds)],
      );
    const newVersionId = (result as ResultSetHeader).insertId;

    return newVersionNumber;
  }

  //vise fag i hver versjon
  async getSubjectsByVersion(versionId: number): Promise<string[]> {
    const [rows] = await pool
      .promise()
      .query<
        RowDataPacket[]
      >('SELECT subject_ids FROM page_versions WHERE version_id = ?', [versionId]);

    if (rows.length === 0) return []; // Check if there are no rows returned

    const subjectIds = JSON.parse(rows[0].subject_ids as string); // Parse JSON string into an array
    return subjectIds;
  }
  // versjonering for logging av sletting og redigering av fag
  async createSubjectVersion(subjectId: number, userId: string): Promise<number> {
    console.log(`Creating version for subject: ${subjectId} by userId: ${userId}`);

    const [rows] = await pool
      .promise()
      .query(
        'SELECT MAX(version_number) AS max_version FROM subject_versions WHERE subject_id = ?',
        [subjectId],
      );

    const currentVersion = (rows as RowDataPacket[])[0];
    const newVersionNumber = (currentVersion?.max_version || 0) + 1;

    const [subjects] = await pool
      .promise()
      .query<RowDataPacket[]>('SELECT id FROM Subjects WHERE id = ?', [subjectId]);

    const [result] = await pool
      .promise()
      .query(
        'INSERT INTO subject_versions (subject_id, user_id, version_number) VALUES (?, ?, ?)',
        [subjectId, userId, newVersionNumber],
      );
    const newVersionId = (result as ResultSetHeader).insertId;

    return newVersionNumber;
  }

  // Ny funksjon for å hente alle anmeldelser for et bestemt subjectId
  getReviewsBySubjectId(subjectId: string): Promise<Review[]> {
    return new Promise<Review[]>((resolve, reject) => {
      pool.query(
        `SELECT id, text, stars, submitterName, user_id AS userId
         FROM Reviews
         WHERE subjectId = ?
         ORDER BY id DESC`,
        [subjectId],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);
          resolve(results as Review[]);
        },
      );
    });
  }

  createReview(
    subjectId: string,
    text: string,
    stars: number,
    userId: number,
    submitterName: string,
  ): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      pool.query(
        'INSERT INTO Reviews (subjectId, text, stars, user_id, submitterName) VALUES (?, ?, ?, ?, ?)',
        [subjectId, text, stars, userId, submitterName],
        (error, results: ResultSetHeader) => {
          if (error) return reject(error);
          resolve(results.insertId);
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

  getSubjectsByFieldAndLevel(fieldId: number, levelId: number): Promise<Subject[]> {
    return new Promise<Subject[]>((resolve, reject) => {
      pool.query(
        'SELECT * FROM Subjects WHERE fieldId = ? AND levelId = ? ORDER BY id ASC',
        [fieldId, levelId],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);
          resolve(results as Subject[]);
        },
      );
    });
  }

  async createSubject(id: string | number, name: string, fieldId: number, levelId: number): Promise<string> {
    try {
      const uppercaseId = String(id).toUpperCase();
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  
      const existingSubject = await this.getSubjectByIdCaseInsensitive(uppercaseId);
      if (existingSubject) {
        throw new Error(`Subject with ID '${uppercaseId}' already exists`);
      }
  
      await pool.promise().query('INSERT INTO Subjects (id, name, fieldId, levelId) VALUES (?, ?, ?, ?)', [
        uppercaseId,
        formattedName,
        fieldId,
        levelId,
      ]);
  
      return uppercaseId;
    } catch (error) {
      throw error;
    }
  }

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

  getAllLevels(): Promise<{ id: number; name: string }[]> {
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM Levels', (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        resolve(results as { id: number; name: string }[]);
      });
    });
  }

  getSubjectById(id: string): Promise<Subject | null> {
    return new Promise<Subject | null>((resolve, reject) => {
      pool.query('SELECT * FROM Subjects WHERE id = ?', [id], (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        resolve(results.length > 0 ? (results[0] as Subject) : null);
      });
    });
  }

  getSubjectsByField(fieldId: number): Promise<Subject[]> {
    return new Promise<Subject[]>((resolve, reject) => {
      pool.query(
        'SELECT * FROM Subjects WHERE fieldId = ? ORDER BY id ASC',
        [fieldId],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);
          resolve(results as Subject[]);
        },
      );
    });
  }

  getSubject(id: string): Promise<Subject | undefined> {
    return new Promise<Subject | undefined>((resolve, reject) => {
      pool.query('SELECT * FROM Subjects WHERE id = ?', [id], (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        if (results.length === 0) return resolve(undefined);

        const subject = results[0] as Subject;
        pool.query(
          'SELECT * FROM Reviews WHERE subjectId = ? ORDER BY id DESC',
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

  deleteReview(reviewId: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      pool.query('DELETE FROM Reviews WHERE id = ?', [reviewId], (error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  }

  updateReview(reviewId: number, text: string, stars: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      pool.query(
        'UPDATE Reviews SET text = ?, stars = ? WHERE id = ?',
        [text, stars, reviewId],
        (error) => {
          if (error) return reject(error);
          resolve();
        },
      );
    });
  }

  // Hent antall emner per nivå for et spesifikt fagfelt
  // Hent antall emner per nivå, og det totale antallet emner for et spesifikt fagfelt
  getSubjectCountByLevel(fieldId: number): Promise<{ levelId: number | null; count: number }[]> {
    return new Promise((resolve, reject) => {
      pool.query(
        `
      SELECT levelId, COUNT(*) as count 
      FROM Subjects 
      WHERE fieldId = ? 
      GROUP BY levelId WITH ROLLUP
      `,
        [fieldId],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);

          resolve(results.map((row) => ({ levelId: row.levelId, count: row.count })));

          // Mapper resultatene og legger til et ekstra objekt for total antall emner
          const counts = results.map((row) => ({
            levelId: row.levelId !== null ? row.levelId : null,
            count: row.count,
          }));

          resolve(counts);
        },
      );
    });
  }

  async updateSubject(subjectId: string, name: string, fieldId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      pool.query(
        'UPDATE Subjects SET name = ?, fieldId = ? WHERE id = ?',
        [name, fieldId, subjectId],
        (error) => {
          if (error) return reject(error);
          resolve();
        },
      );
    });
  }

  async deleteSubject(subjectId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Deleting reviews for subject:', subjectId);
      pool.query('DELETE FROM Reviews WHERE subjectId = ?', [subjectId], (reviewError) => {
        if (reviewError) {
          console.error('Error deleting reviews for subject:', reviewError);
          return reject(reviewError);
        }
        console.log('Deleting subject:', subjectId);
        pool.query('DELETE FROM Subjects WHERE id = ?', [subjectId], (subjectError) => {
          if (subjectError) {
            console.error('Error deleting subject:', subjectError);
            return reject(subjectError);
          }
          console.log('Subject deleted successfully:', subjectId);
          resolve();
        });
      });
    });
  }

  async updateSubjectLevel(subjectId: string, levelId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      pool.query('UPDATE Subjects SET levelId = ? WHERE id = ?', [levelId, subjectId], (error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  }
}

// Opprett instanser av service-klassene
const reviewService = new ReviewService();
const fieldService = new FieldService();

// Definer ruter
const router = express.Router();

// Resten av ruter...

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

// Endepunkt for å hente emner basert på fagfelt og nivå
router.get('/fields/:fieldId/subjects', async (req: Request, res: Response) => {
  const { fieldId } = req.params;
  const levelId = req.query.levelId;

  try {
    let subjects;
    if (levelId) {
      subjects = await reviewService.getSubjectsByFieldAndLevel(Number(fieldId), Number(levelId));
    } else {
      subjects = await reviewService.getSubjectsByField(Number(fieldId));
    }
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Legg til nytt subject for et spesifikt field
// Endre til å inkludere nivået korrekt
router.post('/fields/:fieldId/subjects', async (req: Request, res: Response) => {
  const { fieldId } = req.params;
  const { id, name, level, userId } = req.body;

  if (!id || !name || !level) {
    // Validerer at alle feltene mottas
    return res.status(400).json({ error: 'ID, navn eller nivå mangler' });
  }

  try {
    const newSubjectId = await reviewService.createSubject(id, name, Number(fieldId), level);
    res.json({ id: newSubjectId, name, level });
  } catch (error) {
    console.error('Feil ved forsøk på å legge til emne i databasen:', error);
    res.status(500).json({ error: 'Kunne ikke legge til emne' });
  }
});

// Hent antall emner per nivå for et spesifikt field
router.get('/fields/:fieldId/subject-counts', async (req: Request, res: Response) => {
  const { fieldId } = req.params;
  try {
    const counts = await reviewService.getSubjectCountByLevel(Number(fieldId));
    res.json(counts);
  } catch (error) {
    console.error('Error fetching subject counts by level:', error);
    res.status(500).json({ error: 'Failed to fetch subject counts' });
  }
});

//endringslogg:
router.get('/api/history', async (req, res) => {
  try {
    const [rows] = await pool.promise().query(
      `
      SELECT 
        pv.version_number,
        pv.created_at AS timestamp,
        u.name AS user_name,
        'added' AS action_type
      FROM 
        page_versions pv
      JOIN 
        users u ON pv.user_id = u.id

      UNION ALL

      SELECT 
        sv.version_number,
        sv.created_at AS timestamp,
        u.name AS user_name,
        'deleted' AS action_type
      FROM 
        subject_versions sv
      JOIN 
        users u ON sv.user_id = u.id

      ORDER BY 
        timestamp DESC
      `,
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching change history:', error);
    res.status(500).json({ error: 'Failed to fetch change history' });
  }
}); // <-- Close this router.get method properly

// Endepunkt for å hente totalt antall emner for et spesifikt field
router.get('/fields/:fieldId/total-subjects-count', async (req: Request, res: Response) => {
  const { fieldId } = req.params;
  try {
    const result = await reviewService.getTotalSubjectsCount(Number(fieldId));
    res.json({ total: result });
  } catch (error) {
    console.error('Error fetching total subjects count:', error);
    res.status(500).json({ error: 'Failed to fetch total subjects count' });
  }
});

router.get('/subjects/search', async (req, res) => {
  const searchTerm = req.query.q as string;
  if (!searchTerm) {
      return res.json([]); // Returner tom array hvis ingen query
  }

  try {
      const subjects = await reviewService.searchSubjects(searchTerm);
      const formattedSubjects = subjects.map(subject => ({
          ...subject,
          id: String(subject.id).toUpperCase(),
          name: subject.name.charAt(0).toUpperCase() + subject.name.slice(1).toLowerCase(),
      }));
      res.json(formattedSubjects);
  } catch (error) {
      console.error('Error searching for subjects:', error);
      res.status(500).json({ error: 'Failed to search for subjects' });
  }
});

export { router as reviewRouter, reviewService, fieldService };
