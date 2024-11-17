import axios from 'axios';
import app from '../src/app';
import { Server } from 'http';
import { pool } from '../src/mysql-pool';
import { RowDataPacket } from 'mysql2';

let server: Server;

beforeAll(() => {
  const TEST_PORT = 3001;
  server = app.listen(TEST_PORT, () => {
    console.log(`Test server running on port ${TEST_PORT}`);
  });
  axios.defaults.baseURL = `http://localhost:${TEST_PORT}/api/v2`; // Ensure /api/v2 matches your backend router prefix
});

afterAll(async () => {
  if (server) {
    await server.close();
  }
  await pool.end();
});

beforeEach(async () => {
  // Clean up related tables
  await pool.promise().query('DELETE FROM Subjects');
  await pool.promise().query('DELETE FROM Fields');
  await pool.promise().query('DELETE FROM Levels');
  await pool.promise().query('DELETE FROM Campuses');

  // Insert test data
  await pool
    .promise()
    .query('INSERT INTO Campuses (campusId, name) VALUES (?, ?)', [1, 'Test Campus']);
  await pool
    .promise()
    .query('INSERT INTO Fields (id, name, campusId) VALUES (?, ?, ?)', [1, 'Test Field', 1]);
  await pool.promise().query('INSERT INTO Levels (id, name) VALUES (?, ?)', [1, 'Level 1']);
  await pool.promise().query('INSERT INTO Levels (id, name) VALUES (?, ?)', [2, 'Level 2']);
});

describe('Subject Routes', () => {
  describe('POST /fields/:fieldId/subjects', () => {
    test('should successfully add a new subject', async () => {
      const newSubject = {
        id: 'testSubject1',
        name: 'Test Subject',
        level: 1,
      };

      const response = await axios.post('/fields/1/subjects', newSubject);

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        id: newSubject.id,
        name: newSubject.name,
        level: newSubject.level,
      });

      const [rows] = await pool
        .promise()
        .query<RowDataPacket[]>('SELECT * FROM Subjects WHERE id = ?', ['testSubject1']);
      expect(rows.length).toBe(1);
      expect(rows[0].name).toBe('Test Subject');
    });

    test('should fail if subject ID already exists', async () => {
      const newSubject = {
        id: 'testSubject1',
        name: 'Test Subject',
        level: 1,
      };

      await axios.post('/fields/1/subjects', newSubject);

      try {
        await axios.post('/fields/1/subjects', newSubject);
      } catch (error: any) {
        expect(error.response.status).toBe(500);
        expect(error.response.data.error).toContain('already exists');
      }
    });

    test('should fail if required fields are missing', async () => {
      const incompleteSubject = { id: '', name: 'Test Subject' };

      try {
        await axios.post('/fields/1/subjects', incompleteSubject);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toEqual({
          error: 'ID, name, or level missing',
        });
      }
    });
  });

  describe('GET /fields/:fieldId/subjects', () => {
    beforeEach(async () => {
      await pool.promise().query('INSERT INTO Subjects (id, name, fieldId, levelId) VALUES ?', [
        [
          ['testSubject1', 'Test Subject 1', 1, 1],
          ['testSubject2', 'Test Subject 2', 1, 2],
        ],
      ]);
    });

    test('should fetch all subjects for a field', async () => {
      const response = await axios.get('/fields/1/subjects');

      expect(response.status).toBe(200);
      expect(response.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'testSubject1', name: 'Test Subject 1' }),
          expect.objectContaining({ id: 'testSubject2', name: 'Test Subject 2' }),
        ]),
      );
    });

    test('should fetch subjects by level', async () => {
      const response = await axios.get('/fields/1/subjects?levelId=1');

      expect(response.status).toBe(200);
      expect(response.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'testSubject1', name: 'Test Subject 1', levelId: 1 }),
        ]),
      );
    });
  });

  describe('GET /fields/:fieldId/subject-counts', () => {
    beforeEach(async () => {
      await pool.promise().query('INSERT INTO Subjects (id, name, fieldId, levelId) VALUES ?', [
        [
          ['testSubject1', 'Test Subject 1', 1, 1],
          ['testSubject2', 'Test Subject 2', 1, 2],
          ['testSubject3', 'Test Subject 3', 1, 1],
        ],
      ]);
    });

    test('should return counts of subjects by level', async () => {
      const response = await axios.get('/fields/1/subject-counts');

      expect(response.status).toBe(200);
      expect(response.data).toEqual(
        expect.arrayContaining([
          { levelId: 1, count: 2 },
          { levelId: 2, count: 1 },
        ]),
      );
    });
  });

  describe('DELETE /subjects/:subjectId', () => {
    beforeEach(async () => {
      await pool
        .promise()
        .query('INSERT INTO Subjects (id, name, fieldId, levelId) VALUES (?, ?, ?, ?)', [
          'testSubject1',
          'Test Subject',
          1,
          1,
        ]);
    });

    test('should delete a subject if authorized', async () => {
      const response = await axios.delete('/subjects/testSubject1', {
        data: { userId: 35 },
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('Subject deleted successfully');

      const [rows] = await pool
        .promise()
        .query<RowDataPacket[]>('SELECT * FROM Subjects WHERE id = ?', ['testSubject1']);
      expect(rows.length).toBe(0);
    });

    test('should fail if not authorized', async () => {
      try {
        await axios.delete('/subjects/testSubject1', {
          data: { userId: 10 },
        });
      } catch (error: any) {
        expect(error.response.status).toBe(403);
        expect(error.response.data).toEqual({
          error: 'Not authorized to delete this subject',
        });
      }
    });
  });
});
