import { pool } from '../mysql-pool';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// Definerer typen for et fag
export type Subject = {
  id: string;
  name: string;
  fieldId: number;
  levelId: number;
  reviews?: Review[];
};

// Definerer typen for en anmeldelse
export type Review = {
  id: number;
  subjectId: string;
  text: string;
  stars: number;
  submitterName: string;
  userId: number;
};

class SubjectService {
  // Oppdaterer beskrivelsen av et fag
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

  // Søker etter fag basert på navn
  searchSubjects(searchTerm: string): Promise<Subject[]> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM Subjects WHERE name LIKE ?`;
      pool.query(sql, [`%${searchTerm}%`], (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        resolve(results as Subject[]);
      });
    });
  }

  // Henter detaljer om et spesifikt fag, inkludert anmeldelser
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

  // Henter fag for et spesifikt felt
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

  // Oppretter et nytt fag
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


      // Sjekker om faget allerede eksisterer
      const existingSubject = await this.getSubjectByIdCaseInsensitive(uppercaseId);
      if (existingSubject) {
        throw new Error(`Subject with ID '${id}' already exists`);
      }


      // Setter inn faget i databasen
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


  // Sjekker om et fag eksisterer basert på ID (case-insensitive)
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

  // Henter antall fag gruppert etter nivå for et felt
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

  // Oppdaterer et fags navn og felt
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

    try {
      const connection = await pool.promise().getConnection();

      try {
        // Begin transaction
        await connection.beginTransaction();

        // Step 1: Delete associated rows in dependent tables
        await connection.query('DELETE FROM Reviews WHERE subjectId = ?', [subjectId]);
        await connection.query('DELETE FROM search WHERE subject_id = ?', [subjectId]);
        await connection.query('DELETE FROM page_versions WHERE subject_id = ?', [subjectId]);
        await connection.query('DELETE FROM subject_versions WHERE subject_id = ?', [subjectId]);
        await connection.query('DELETE FROM subject_review_versions WHERE subject_id = ?', [
          subjectId,
        ]);

        // Step 2: Delete the subject from the Subjects table
        const [result] = await connection.query<ResultSetHeader>(
          'DELETE FROM Subjects WHERE id = ?',
          [subjectId],
        );

        if (result.affectedRows === 0) {
          console.warn(`Subject with ID ${subjectId} does not exist.`);
          throw new Error('Subject not found');
        }
        
        // Commit transaction
        await connection.commit();

        console.log(`Subject with ID ${subjectId} deleted successfully`);
      } catch (error) {
        // Rollback transaction on error
        await connection.rollback();
        throw error;
      } finally {
        // Release the connection back to the pool
        connection.release();
      }
    } catch (error) {
      console.error(`Error during deletion for subjectId ${subjectId}:`, error);
      throw error;
    }
  }
  // Oppdaterer nivået til et fag
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

  // Henter totalt antall fag for et felt
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

// Eksporterer SubjectService for bruk andre steder
const subjectService = new SubjectService();
export default subjectService;
