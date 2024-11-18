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
  // Henter alle feltene fra databasen
  getFields(): Promise<Field[]> {
    return new Promise<Field[]>((resolve, reject) => {
      pool.query('SELECT * FROM Fields', (error, results: RowDataPacket[]) => {
        if (error) {
          console.error('Feil ved henting av felt fra databasen:', error);
          return reject(error);
        }
        resolve(results as Field[]);
      });
    });
  }

  // Henter feltene som tilhører en spesifikk campus
  getFieldsByCampus(campus: string): Promise<Field[]> {
    return new Promise<Field[]>((resolve, reject) => {
      pool.query(
        `SELECT f.id, f.name, f.campusId
         FROM Fields f
         JOIN Campuses c ON f.campusId = c.campusId
         WHERE c.name = ?`,
        [campus],
        (error, results: RowDataPacket[]) => {
          if (error) {
            console.error(`Feil ved henting av felt for campus "${campus}":`, error);
            return reject(error);
          }
          resolve(results as Field[]);
        },
      );
    });
  }

  // Henter et felt basert på ID
  getFieldById(id: number): Promise<Field | null> {
    return new Promise<Field | null>((resolve, reject) => {
      pool.query('SELECT * FROM Fields WHERE id = ?', [id], (error, results: RowDataPacket[]) => {
        if (error) {
          console.error(`Feil ved henting av felt med ID ${id}:`, error);
          return reject(error);
        }
        resolve(results.length > 0 ? (results[0] as Field) : null);
      });
    });
  }

  // Henter alle campuser fra databasen
  getAllCampuses(): Promise<Campus[]> {
    return new Promise<Campus[]>((resolve, reject) => {
      pool.query('SELECT * FROM Campuses', (error, results: RowDataPacket[]) => {
        if (error) {
          console.error('Feil ved henting av campuser fra databasen:', error);
          return reject(error);
        }
        resolve(results as Campus[]);
      });
    });
  }

  // Henter det totale antallet fag som tilhører et gitt felt
  async getTotalSubjectsCount(fieldId: number): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      pool.query(
        'SELECT COUNT(*) as total FROM Subjects WHERE fieldId = ?',
        [fieldId],
        (error, results: RowDataPacket[]) => {
          if (error) {
            console.error(`[FEIL] Klarte ikke hente antall fag for feltId ${fieldId}:`, error);
            return reject(error);
          }
          console.log(`[DEBUG] Antall resultater for feltId ${fieldId}:`, results);
          resolve(results[0]?.total || 0); // Returnerer 0 hvis det ikke finnes noen fag
        },
      );
    });
  }

  // Henter navnet på et felt basert på feltets ID
  getFieldNameById(fieldId: number): Promise<string | null> {
    return new Promise((resolve, reject) => {
      pool.query(
        'SELECT name FROM Fields WHERE id = ?',
        [fieldId],
        (error, results: RowDataPacket[]) => {
          if (error) {
            console.error(`Feil ved henting av navn for felt ID ${fieldId}:`, error);
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
