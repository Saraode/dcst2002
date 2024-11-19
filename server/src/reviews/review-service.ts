import { pool } from '../mysql-pool';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// Type for en anmeldelse
export type Review = {
  id: number;
  subjectId: string;
  text: string;
  stars: number;
  submitterName: string;
  userId: number;
  created_date?: string;
};

class ReviewService {
  // Henter alle anmeldelser for et gitt fag-ID, sortert i synkende rekkefølge (nyeste først)
  getReviewsBySubjectId(subjectId: string): Promise<Review[]> {
    return new Promise((resolve, reject) => {
      console.log(`Henter anmeldelser for fag-ID: ${subjectId}`);
      pool.query(
        `SELECT id, text, stars, submitterName, user_id AS userId, created_date
         FROM Reviews
         WHERE subjectId = ?
         ORDER BY id DESC`,
        [subjectId],
        (error, results: RowDataPacket[]) => {
          if (error) {
            console.error(`Feil ved henting av anmeldelser for fag-ID ${subjectId}:`, error);
            return reject(error);
          }
          console.log(`Hentet ${results.length} anmeldelser for fag-ID: ${subjectId}`);
          resolve(results as Review[]);
        },
      );
    });
  }

  // Oppretter en ny anmeldelse og returnerer ID-en til den opprettede anmeldelsen
  createReview(
    subjectId: string,
    text: string,
    stars: number,
    userId: number,
    submitterName: string,
  ): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      console.log(`Oppretter anmeldelse for fag-ID: ${subjectId}`);
      pool.query(
        'INSERT INTO Reviews (subjectId, text, stars, user_id, submitterName) VALUES (?, ?, ?, ?, ?)',
        [subjectId, text, stars, userId, submitterName],
        (error, results: ResultSetHeader) => {
          if (error) {
            console.error(`Feil ved oppretting av anmeldelse for fag-ID ${subjectId}:`, error);
            return reject(error);
          }
          console.log(`Anmeldelse opprettet med ID: ${results.insertId}`);
          resolve(results.insertId);
        },
      );
    });
  }

  // Henter en anmeldelse basert på ID, returnerer null hvis ingen anmeldelse finnes
  getReviewById(reviewId: number): Promise<Review | null> {
    return new Promise((resolve, reject) => {
      console.log(`Henter anmeldelse med ID: ${reviewId}`);
      pool.query(
        'SELECT id, text, stars, user_id AS userId, submitterName, created_date FROM Reviews WHERE id = ?',
        [reviewId],
        (error, results: RowDataPacket[]) => {
          if (error) {
            console.error(`Feil ved henting av anmeldelse ID ${reviewId}:`, error);
            return reject(error);
          }
          if (results.length > 0) {
            console.log(`Hentet anmeldelse med ID: ${reviewId}`);
            resolve(results[0] as Review);
          } else {
            console.log(`Fant ingen anmeldelse med ID ${reviewId}`);
            resolve(null);
          }
        },
      );
    });
  }

  // Oppdaterer tekst og stjerner for en eksisterende anmeldelse
  updateReview(reviewId: number, text: string, stars: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      console.log(`Oppdaterer anmeldelse med ID: ${reviewId}`);
      pool.query(
        'UPDATE Reviews SET text = ?, stars = ? WHERE id = ?',
        [text, stars, reviewId],
        (error) => {
          if (error) {
            console.error(`Feil ved oppdatering av anmeldelse ID ${reviewId}:`, error);
            return reject(error);
          }
          console.log(`Anmeldelse med ID: ${reviewId} oppdatert`);
          resolve();
        },
      );
    });
  }

  // Sletter en anmeldelse basert på ID
  deleteReview(reviewId: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      console.log(`Sletter anmeldelse med ID: ${reviewId}`);
      pool.query('DELETE FROM Reviews WHERE id = ?', [reviewId], (error) => {
        if (error) {
          console.error(`Feil ved sletting av anmeldelse ID ${reviewId}:`, error);
          return reject(error);
        }
        console.log(`Anmeldelse med ID: ${reviewId} slettet`);
        resolve();
      });
    });
  }

  // Henter gjennomsnittlig stjerner for et fag-ID, returnerer 0 hvis ingen anmeldelser finnes
  getAverageStarsForSubject(subjectId: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      pool.query(
        'SELECT AVG(stars) as averageStars FROM Reviews WHERE subjectId = ?',
        [subjectId],
        (error, results: RowDataPacket[]) => {
          if (error) {
            console.error(
              `Feil ved beregning av gjennomsnittlige stjerner for fag-ID ${subjectId}:`,
              error,
            );
            return reject(error);
          }
          console.log(
            `Gjennomsnittlige stjerner for fag-ID ${subjectId}: ${results[0]?.averageStars || 0}`,
          );
          resolve(results[0]?.averageStars || 0);
        },
      );
    });
  }
}

export const reviewService = new ReviewService();
