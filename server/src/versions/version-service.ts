import { pool } from '../mysql-pool';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

class VersionService {
  async createPageVersion(fieldId: number, userId: string, description: string): Promise<number> {
    try {
      console.log(`Creating page version for field ID: ${fieldId} by user ID: ${userId}`);

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

      if (!Array.isArray(subjects)) {
        throw new Error('Failed to fetch subjects for the field');
      }

      const subjectIds = subjects.map((subject: RowDataPacket) => subject.id);

      const [result] = await pool
        .promise()
        .query(
          'INSERT INTO page_versions (field_id, version_number, user_id, subject_ids, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
          [fieldId, newVersionNumber, userId, JSON.stringify(subjectIds), description],
        );

      const insertId = (result as ResultSetHeader).insertId;
      console.log(`Page version created successfully with ID: ${insertId}`);

      return newVersionNumber;
    } catch (error) {
      console.error(`Error creating page version for field ID: ${fieldId}`, error);
      throw new Error('Failed to create page version');
    }
  }

  async getSubjectsByVersion(versionId: number): Promise<string[]> {
    try {
      console.log(`Fetching subjects for version ID: ${versionId}`);

      const [rows] = await pool
        .promise()
        .query<
          RowDataPacket[]
        >('SELECT subject_ids FROM page_versions WHERE version_id = ?', [versionId]);

      if (rows.length === 0) {
        console.warn(`No subjects found for version ID: ${versionId}`);
        return [];
      }

      const subjectIds = JSON.parse(rows[0].subject_ids as string) || [];
      return Array.isArray(subjectIds) ? subjectIds : [];
    } catch (error) {
      console.error(`Error fetching subjects for version ID: ${versionId}`, error);
      throw new Error('Failed to fetch subjects for version');
    }
  }
  async createSubjectVersion(
    subjectId: string,
    userId: string,
    actionType: string,
    description: string,
  ): Promise<number> {
    try {
      console.log(`Creating subject version for subject ID: ${subjectId} by user ID: ${userId}`);

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

      console.log(
        `Subject version created successfully for subject ID: ${subjectId}, version: ${newVersionNumber}`,
      );

      return newVersionNumber;
    } catch (error) {
      console.error(`Error creating subject version for subject ID: ${subjectId}`, error);
      throw new Error('Failed to create subject version');
    }
  }
}

export const versionService = new VersionService();
