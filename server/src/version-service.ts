import { pool } from './mysql-pool';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

class VersionService {
  //lagre versjon i database for fagoversikt
  async createPageVersion(fieldId: number, userId: string, description: string): Promise<number> {
    console.log(
      `Creating version for fieldId: ${fieldId} by userId: ${userId}, description: ${description}`,
    );

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
        'INSERT INTO page_versions (field_id, version_number, user_id, subject_ids, created_at) VALUES ( ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [fieldId, newVersionNumber, userId, JSON.stringify(subjectIds), description],
      );

    console.log(`Page version created: Version ID: ${(result as ResultSetHeader).insertId}`);
    return newVersionNumber;
  }

  //hente versjon fra database for fagoversikt
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
  async createSubjectVersion(
    subjectId: string,
    userId: string,
    actionType: string,
    description: string,
  ): Promise<number> {
    console.log(`Creating version for subject: ${subjectId} by userId: ${userId}`);

    const [rows] = await pool
      .promise()
      .query(
        'SELECT MAX(version_number) AS max_version FROM subject_versions WHERE subject_id = ?',
        [subjectId],
      );

    const currentVersion = (rows as RowDataPacket[])[0];
    const newVersionNumber = (currentVersion?.max_version || 0) + 1;

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
