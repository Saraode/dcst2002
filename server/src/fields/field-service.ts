import { pool } from '../mysql-pool';
import type { RowDataPacket } from 'mysql2';

export type Field = {
  id: number;
  name: string;
  campusId: number;
};
export type Campus = {
  campusId: number;
  name: string;
};

export class FieldService {
  getFields(): Promise<Field[]> {
    return new Promise<Field[]>((resolve, reject) => {
      pool.query('SELECT * FROM Fields', (error, results: RowDataPacket[]) => {
        if (error) {
          console.error('Error fetching fields from database:', error);
          return reject(error);
        }
        resolve(results as Field[]);
      });
    });
  }

  // Fields by campus
  getFieldsByCampus(campus: string): Promise<Field[]> {
    return new Promise<Field[]>((resolve, reject) => {
      pool.query(
        `SELECT f.id, f.name, f.campusId
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

  // Field by ID
  getFieldById(id: number): Promise<Field | null> {
    return new Promise<Field | null>((resolve, reject) => {
      pool.query('SELECT * FROM Fields WHERE id = ?', [id], (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        resolve(results.length > 0 ? (results[0] as Field) : null);
      });
    });
  }
  getAllCampuses(): Promise<Campus[]> {
    return new Promise<Campus[]>((resolve, reject) => {
      pool.query('SELECT * FROM Campuses', (error, results: RowDataPacket[]) => {
        if (error) return reject(error);
        resolve(results as Campus[]);
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
          resolve(results[0].total || 0);
        },
      );
    });
  }
  getFieldNameById(fieldId: number): Promise<string | null> {
    return new Promise((resolve, reject) => {
      pool.query(
        'SELECT name FROM Fields WHERE id = ?',
        [fieldId],
        (error, results: RowDataPacket[]) => {
          if (error) {
            console.error(`Error fetching field name for field ID ${fieldId}:`, error);
            return reject(error);
          }
          resolve(results.length > 0 ? results[0].name : null);
        },
      );
    });
  }
}

const fieldService = new FieldService();
export default fieldService;
