import { pool } from '../mysql-pool';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

class VersionService {
  // Lagre en ny versjon i databasen for fagoversikten
  async createPageVersion(fieldId: number, userId: string, description: string): Promise<number> {
    console.log(
      `Oppretter versjon for felt-ID: ${fieldId} av bruker-ID: ${userId}, beskrivelse: ${description}`,
    );

    // Henter den høyeste eksisterende versjonsnummeret for feltet
    const [rows] = await pool
      .promise()
      .query('SELECT MAX(version_number) AS max_version FROM page_versions WHERE field_id = ?', [
        fieldId,
      ]);

    const currentVersion = (rows as RowDataPacket[])[0];
    const newVersionNumber = (currentVersion?.max_version || 0) + 1;

    // Henter alle fag som tilhører feltet
    const [subjects] = await pool
      .promise()
      .query<RowDataPacket[]>('SELECT id FROM Subjects WHERE fieldId = ?', [fieldId]);

    const subjectIds = subjects.map((subject: RowDataPacket) => subject.id);

    // Setter inn den nye versjonen i databasen
    const [result] = await pool
      .promise()
      .query(
        'INSERT INTO page_versions (field_id, version_number, user_id, subject_ids, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [fieldId, newVersionNumber, userId, JSON.stringify(subjectIds), description],
      );

    console.log(`Fagoversiktsversjon opprettet: Versjon ID: ${(result as ResultSetHeader).insertId}`);
    return newVersionNumber;
  }

  // Hente fag basert på en spesifikk versjon fra databasen
  async getSubjectsByVersion(versionId: number): Promise<string[]> {
    const [rows] = await pool
      .promise()
      .query<
        RowDataPacket[]
      >('SELECT subject_ids FROM page_versions WHERE version_id = ?', [versionId]);

    if (rows.length === 0) return []; // Sjekker om det ikke finnes rader

    const subjectIds = JSON.parse(rows[0].subject_ids as string); // Parser JSON-strengen til en array
    return subjectIds;
  }

  // Oppretter en ny versjon for logging av sletting og redigering av fag
  async createSubjectVersion(
    subjectId: string,
    userId: string,
    actionType: string,
    description: string,
  ): Promise<number> {
    console.log(`Oppretter versjon for fag: ${subjectId} av bruker-ID: ${userId}`);

    // Henter den høyeste eksisterende versjonsnummeret for faget
    const [rows] = await pool
      .promise()
      .query(
        'SELECT MAX(version_number) AS max_version FROM subject_versions WHERE subject_id = ?',
        [subjectId],
      );

    const currentVersion = (rows as RowDataPacket[])[0];
    const newVersionNumber = (currentVersion?.max_version || 0) + 1;

    // Setter inn den nye versjonen i databasen
    const [result] = await pool
      .promise()
      .query(
        'INSERT INTO subject_versions (subject_id, user_id, version_number, action_type, description) VALUES (?, ?, ?, ?, ?)',
        [subjectId, userId, newVersionNumber, actionType, description],
      );

    return newVersionNumber;
  }
}

export const versionService = new VersionService();
