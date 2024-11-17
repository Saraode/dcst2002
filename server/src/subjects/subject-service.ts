import { pool } from '../mysql-pool';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export type Subject = {
  id: string;
  name: string;
  fieldId: number;
  reviews?: Review[];
};

export type Review = {
  id: number;
  subjectId: string;
  text: string;
  stars: number;
  submitterName: string;
  userId: number;
};

class SubjectService {
  // Search for subjects by name
  searchSubjects(searchTerm: string): Promise<Subject[]> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM Subjects WHERE name LIKE ?`;
      pool.query(sql, [`%${searchTerm}%`], (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        resolve(results as Subject[]);
      });
    });
  }

  getSubject(subjectId: string): Promise<Subject | undefined> {
    return new Promise<Subject | undefined>((resolve, reject) => {
      pool.query(
        'SELECT * FROM Subjects WHERE id = ?',
        [subjectId],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);
          if (results.length === 0) return resolve(undefined);

          const subject = results[0] as Subject;
          pool.query(
            'SELECT * FROM Reviews WHERE subjectId = ? ORDER BY id DESC',
            [subjectId],
            (reviewError, reviewResults: RowDataPacket[]) => {
              if (reviewError) return reject(reviewError);
              subject.reviews = reviewResults as Review[]; // Attach reviews to the subject
              resolve(subject);
            },
          );
        },
      );
    });
  }

  // Get subjects for a specific field and level
  getSubjectsByFieldAndLevel(fieldId: number, levelId: number): Promise<Subject[]> {
    console.log('Fetching subjects for field:', fieldId, 'and level:', levelId); // Debug log
    return new Promise<Subject[]>((resolve, reject) => {
      pool.query(
        'SELECT * FROM Subjects WHERE fieldId = ? AND levelId = ? ORDER BY id ASC',
        [fieldId, levelId],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);
          console.log('Subjects fetched:', results); // Debug log
          resolve(results as Subject[]);
        },
      );
    });
  }

  // Get subjects by field ID
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

  // Create a new subject
  async createSubject(id: string, name: string, fieldId: number, levelId: number): Promise<string> {
    try {
      const existingSubject = await this.getSubjectByIdCaseInsensitive(id);
      if (existingSubject) {
        throw new Error(`Subject with ID '${id}' already exists`);
      }

      const [result] = await pool
        .promise()
        .query('INSERT INTO Subjects (id, name, fieldId, levelId) VALUES (?, ?, ?, ?)', [
          id,
          name,
          fieldId,
          levelId,
        ]);

      return id;
    } catch (error) {
      throw error;
    }
  }

  // Get subject by ID (case-insensitive)
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

  // Get subject by ID
  getSubjectById(id: string): Promise<Subject | null> {
    return new Promise<Subject | null>((resolve, reject) => {
      pool.query('SELECT * FROM Subjects WHERE id = ?', [id], (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        resolve(results.length > 0 ? (results[0] as Subject) : null);
      });
    });
  }

  // Get subject count grouped by levels
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

          resolve(
            results.map((row) => ({
              levelId: row.levelId,
              count: row.count,
            })),
          );
        },
      );
    });
  }

  // Update a subject's name and field ID
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

  // Delete a subject and its associated reviews
  async deleteSubject(subjectId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // First, delete all reviews for the subject
      pool.query('DELETE FROM Reviews WHERE subjectId = ?', [subjectId], (reviewError) => {
        if (reviewError) {
          console.error(`Error deleting reviews for subjectId ${subjectId}:`, reviewError);
          return reject(reviewError);
        }

        // Then, delete the subject itself
        pool.query('DELETE FROM Subjects WHERE id = ?', [subjectId], (subjectError) => {
          if (subjectError) {
            console.error(`Error deleting subject with ID ${subjectId}:`, subjectError);
            return reject(subjectError);
          }

          console.log(`Subject with ID ${subjectId} deleted successfully`);
          resolve();
        });
      });
    });
  }

  // Update the level of a subject
  async updateSubjectLevel(subjectId: string, levelId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      pool.query('UPDATE Subjects SET levelId = ? WHERE id = ?', [levelId, subjectId], (error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  }

  getAllLevels(): Promise<{ id: number; name: string }[]> {
    return new Promise((resolve, reject) => {
      pool.query('SELECT id, name FROM Levels', (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        resolve(results as { id: number; name: string }[]);
      });
    });
  }

  async getTotalSubjectsCount(fieldId: number): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      pool.query(
        'SELECT COUNT(*) as total FROM Subjects WHERE fieldId = ?',
        [fieldId],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);
          resolve(results[0].total || 0); // Default to 0 if no subjects
        },
      );
    });
  }
}

const subjectService = new SubjectService();
export default subjectService;
