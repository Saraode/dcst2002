import { pool } from '../mysql-pool';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export type Subject = {
  id: string;
  name: string;
  fieldId: number;
  levelId: number;
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
  // Søker etter fag
  async updateSubjectDescription(subjectId: string, description: string): Promise<void> {
    return new Promise((resolve, reject) => {
      pool.query(
        'UPDATE Subjects SET description = ? WHERE id = ?',
        [description, subjectId],
        (error) => {
          if (error) return reject(error);
          resolve();
        },
      );
    });
  }
  searchSubjects(searchTerm: string): Promise<Subject[]> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM Subjects WHERE name LIKE ?`;
      pool.query(sql, [`%${searchTerm}%`], (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        resolve(results as Subject[]);
      });
    });
  }

  // Henter et spesifikt fag basert på ID og inkluderer anmeldelser
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
              subject.reviews = reviewResults as Review[];
              resolve(subject);
            },
          );
        },
      );
    });
  }

  // Henter fag for et gitt felt og nivå
  getSubjectsByFieldAndLevel(fieldId: number, levelId: number): Promise<Subject[]> {
    console.log('Henter fag for felt:', fieldId, 'og nivå:', levelId);
    return new Promise<Subject[]>((resolve, reject) => {
      pool.query(
        'SELECT * FROM Subjects WHERE fieldId = ? AND levelId = ? ORDER BY id ASC',
        [fieldId, levelId],
        (error, results: RowDataPacket[]) => {
          if (error) return reject(error);
          console.log('Fag hentet:', results);
          resolve(results as Subject[]);
        },
      );
    });
  }

  // Henter fag for et gitt felt
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
  async createSubject(
    id: string,
    name: string,
    fieldId: number,
    levelId: number,
    description: string,
  ): Promise<string> {
    try {
      const uppercaseId = id.toUpperCase();
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

      // Check if the subject already exists
      const existingSubject = await this.getSubjectByIdCaseInsensitive(uppercaseId);
      if (existingSubject) {
        throw new Error(`Subject with ID '${id}' already exists`);
      }

      // Insert subject into the database
      const [result] = await pool
        .promise()
        .query(
          'INSERT INTO Subjects (id, name, fieldId, levelId, description) VALUES (?, ?, ?, ?, ?)',
          [uppercaseId, formattedName, fieldId, levelId, description],
        );

      console.log('Subject created, forcing commit:', result);
      await pool.promise().query('COMMIT;'); // Explicitly commit the transaction

      return uppercaseId;
    } catch (error: any) {
      console.error('Error in createSubject:', {
        message: error.message,
        stack: error.stack,
        params: { id, name, fieldId, levelId, description },
      });
      throw error;
    }
  }

  // Sjekker om et fag med en gitt ID (case-insensitive) eksisterer
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

  // Henter et fag basert på eksakt ID
  getSubjectById(id: string): Promise<Subject | null> {
    return new Promise<Subject | null>((resolve, reject) => {
      pool.query('SELECT * FROM Subjects WHERE id = ?', [id], (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        resolve(results.length > 0 ? (results[0] as Subject) : null);
      });
    });
  }

  // Henter antall fag gruppert etter nivå for et spesifikt felt
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

  // Oppdaterer navn og felt for et eksisterende fag
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

  // Sletter et fag og tilhørende anmeldelser
  async deleteSubject(subjectId: string): Promise<void> {
    console.log(`Starting deletion for subjectId: ${subjectId}`);

    return new Promise((resolve, reject) => {
      // Step 1: Delete associated rows in dependent tables
      pool.query('DELETE FROM Reviews WHERE subjectId = ?', [subjectId], (reviewError) => {
        if (reviewError) {
          console.error(`Error deleting reviews for subjectId ${subjectId}:`, reviewError);
          return reject(reviewError);
        }

        pool.query('DELETE FROM page_versions WHERE subject_id = ?', [subjectId], (pageError) => {
          if (pageError) {
            console.error(`Error deleting page versions for subjectId ${subjectId}:`, pageError);
            return reject(pageError);
          }

          console.log(`Page versions deleted for subjectId ${subjectId}`);

          pool.query(
            'DELETE FROM subject_review_versions WHERE subject_id = ?',
            [subjectId],
            (reviewVersionError) => {
              if (reviewVersionError) {
                console.error(
                  `Error deleting subject review versions for subjectId ${subjectId}:`,
                  reviewVersionError,
                );
                return reject(reviewVersionError);
              }

              console.log(`Subject review versions deleted for subjectId ${subjectId}`);

              // Step 2: Delete the subject
              pool.query('DELETE FROM Subjects WHERE id = ?', [subjectId], (subjectError) => {
                if (subjectError) {
                  console.error(`Error deleting subject with ID ${subjectId}:`, subjectError);
                  return reject(subjectError);
                }

                console.log(`Subject with ID ${subjectId} deleted successfully`);
                resolve();
              });
            },
          );
        });
      });
    });
  }

  // Oppdaterer nivået for et fag
  async updateSubjectLevel(subjectId: string, levelId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      pool.query('UPDATE Subjects SET levelId = ? WHERE id = ?', [levelId, subjectId], (error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  }

  // Henter alle nivåer i systemet
  getAllLevels(): Promise<{ id: number; name: string }[]> {
    return new Promise((resolve, reject) => {
      pool.query('SELECT id, name FROM Levels', (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        resolve(results as { id: number; name: string }[]);
      });
    });
  }

  // Henter totalt antall fag for et spesifikt felt
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
}

const subjectService = new SubjectService();
export default subjectService;
